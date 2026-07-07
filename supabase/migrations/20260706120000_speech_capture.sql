-- ============================================================
-- Evolvea — speech capture & AI assessment
--
-- Adds the ability to *record* a child describing a picture, transcribe
-- the audio (STT), and let an LLM judge whether the child mentioned the
-- concepts a typically-developing child of that age would mention.
--
-- Privacy-first (GDPR / children = special-category data):
--   • recording requires explicit per-child parental consent
--   • audio lives in a PRIVATE storage bucket, never public
--   • audio auto-expires (retention window) while the transcript +
--     assessment are kept; deleting a child hard-deletes the audio too
--   • all privileged processing happens in an Edge Function using the
--     service role — the browser only ever holds the publishable key
-- ============================================================

-- ---------- Consent (data minimisation: one timestamp on the child) ----------
alter table public.children
  add column if not exists speech_consent_at timestamptz;

comment on column public.children.speech_consent_at is
  'When the parent consented to voice recording for this child. NULL = no consent → recording UI is hidden and the app falls back to manual parent scoring.';

-- ---------- Processing status ----------
create type public.speech_status as enum (
  'uploaded',      -- audio in storage, awaiting processing
  'transcribing',  -- STT in flight
  'assessing',     -- LLM judging the transcript
  'done',          -- transcript + assessment ready
  'failed'         -- see error column
);

-- ---------- Attempts ----------
create table public.speech_attempts (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  -- linked once the parent finishes the exercise and the session row is written
  session_id   uuid references public.sessions (id) on delete cascade,
  item_index   int not null default 0,
  -- what the child was asked, and the concepts a well-developing child should mention
  prompt       text not null default '' check (char_length(prompt) <= 1000),
  expected     jsonb not null default '[]'::jsonb,   -- string[] of concept keywords
  min_expected int not null default 1 check (min_expected >= 0),
  lang         text not null default 'sk' check (lang in ('sk', 'en', 'de')),
  -- storage object path inside the private `speech` bucket: `<child_id>/<uuid>.webm`
  audio_path   text check (char_length(audio_path) <= 400),
  audio_mime   text check (char_length(audio_mime) <= 80),
  status       public.speech_status not null default 'uploaded',
  -- results (kept even after the audio is purged)
  transcript   text check (char_length(transcript) <= 8000),
  assessment   jsonb, -- { mentioned:[], missed:[], extra:[], passed:bool, feedback:"" }
  stt_model    text,
  llm_model    text,
  error        text check (char_length(error) <= 1000),
  -- GDPR retention: audio is deleted after this instant; transcript/assessment stay
  audio_delete_after timestamptz not null default (now() + interval '30 days'),
  created_at   timestamptz not null default now(),
  processed_at timestamptz
);

create index speech_attempts_child_idx   on public.speech_attempts (child_id, created_at desc);
create index speech_attempts_session_idx on public.speech_attempts (session_id);
create index speech_attempts_status_idx  on public.speech_attempts (status)
  where status in ('uploaded', 'transcribing', 'assessing');
create index speech_attempts_expiry_idx  on public.speech_attempts (audio_delete_after)
  where audio_path is not null;

comment on table public.speech_attempts is
  'One recorded speech attempt: audio pointer + transcript + LLM assessment. Processed asynchronously by the assess-speech Edge Function.';

-- ---------- Clients may only link the session, never rewrite results ----------
-- (service_role, used by the Edge Function, bypasses this.)
create or replace function public.protect_speech_attempt_update()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  -- a parent client may attach the attempt to its session exactly once
  if new.session_id is distinct from old.session_id and old.session_id is not null then
    raise exception 'session link is immutable';
  end if;
  if new.child_id     is distinct from old.child_id
     or new.exercise_id is distinct from old.exercise_id
     or new.audio_path  is distinct from old.audio_path
     or new.expected    is distinct from old.expected
     or new.min_expected is distinct from old.min_expected
     or new.audio_delete_after is distinct from old.audio_delete_after
     or new.transcript  is distinct from old.transcript
     or new.assessment  is distinct from old.assessment
     or new.status      is distinct from old.status then
    raise exception 'only the session link may be updated by clients';
  end if;
  return new;
end;
$$;

create trigger speech_attempts_protect_update
  before update on public.speech_attempts
  for each row execute procedure public.protect_speech_attempt_update();

-- ---------- Deleting an attempt (or its child) removes the audio object ----------
create or replace function public.delete_speech_audio_object()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.audio_path is not null then
    delete from storage.objects
    where bucket_id = 'speech' and name = old.audio_path;
  end if;
  return old;
end;
$$;

create trigger speech_attempts_delete_audio
  after delete on public.speech_attempts
  for each row execute procedure public.delete_speech_audio_object();

-- ---------- Retention: drop expired audio, keep the transcript/assessment ----------
create or replace function public.purge_expired_speech_audio()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- remove the storage objects for attempts past their retention window
  delete from storage.objects
  where bucket_id = 'speech'
    and name in (
      select audio_path from public.speech_attempts
      where audio_path is not null and audio_delete_after <= now()
    );
  -- forget the audio pointer; the transcript + assessment remain
  update public.speech_attempts
  set audio_path = null, audio_mime = null
  where audio_path is not null and audio_delete_after <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.purge_expired_speech_audio() is
  'GDPR retention job — deletes expired voice recordings while keeping the derived transcript/assessment. Schedule daily via pg_cron (see README).';

-- Schedule the retention purge daily at 03:15. Try to enable pg_cron; if the
-- environment doesn't allow it, don't fail the migration — emit a notice so an
-- operator schedules purge_expired_speech_audio() manually (see README).
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    null; -- extension not permitted here; handled below
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'purge-expired-speech-audio', '15 3 * * *',
      $cron$ select public.purge_expired_speech_audio(); $cron$
    );
  else
    raise notice 'pg_cron unavailable — schedule public.purge_expired_speech_audio() manually (see README > GDPR).';
  end if;
end;
$$;

-- ---------- Fold speech results back into the session (race-safe) ----------
-- Called by the Edge Function after each attempt is assessed. Concurrent
-- invocations for the same session are serialized by the row lock, so the last
-- writer reads the freshest snapshot and the completed score cannot be clobbered.
create or replace function public.recompute_session_speech(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_all_done boolean;
  v_total    int;
  v_correct  int;
  v_speech   jsonb;
  v_detail   jsonb;
begin
  -- serialize concurrent recomputes for this session
  perform 1 from public.sessions where id = p_session_id for update;

  select
    bool_and(status in ('done', 'failed')),
    count(*)::int,
    count(*) filter (
      where status = 'done'
        and coalesce(jsonb_array_length(assessment -> 'mentioned'), 0) >= min_expected
    )::int,
    jsonb_agg(
      jsonb_build_object(
        'itemIndex', item_index,
        'prompt', prompt,
        'expected', expected,
        'transcript', transcript,
        'mentioned', coalesce(assessment -> 'mentioned', '[]'::jsonb),
        'missed', coalesce(assessment -> 'missed', '[]'::jsonb),
        'feedback', assessment ->> 'feedback',
        'status', status,
        'passed', (status = 'done'
          and coalesce(jsonb_array_length(assessment -> 'mentioned'), 0) >= min_expected)
      )
      order by item_index
    )
  into v_all_done, v_total, v_correct, v_speech
  from public.speech_attempts
  where session_id = p_session_id;

  if v_speech is null then
    return; -- no attempts linked yet
  end if;

  select coalesce(detail, '{}'::jsonb) into v_detail from public.sessions where id = p_session_id;

  update public.sessions
  set detail        = v_detail || jsonb_build_object('speech', v_speech),
      score_correct = case when v_all_done then v_correct else null end,
      score_total   = case when v_all_done then v_total else null end
  where id = p_session_id;
end;
$$;

revoke execute on function public.recompute_session_speech(uuid) from public, anon, authenticated;

-- ---------- RLS ----------
alter table public.speech_attempts enable row level security;

-- parent inserts attempts for their own child, in the initial 'uploaded' state,
-- ONLY with a live recording consent (GDPR — enforced in the data layer, not UI)
create policy speech_attempts_insert on public.speech_attempts for insert to authenticated
  with check (
    public.is_parent_of(child_id)
    and status = 'uploaded'
    and exists (
      select 1 from public.children c
      where c.id = child_id and c.speech_consent_at is not null
    )
  );

-- parent + therapist of the child may read the results
create policy speech_attempts_select on public.speech_attempts for select to authenticated
  using (public.is_parent_of(child_id) or public.is_therapist_of(child_id));

-- parent may link the session (the trigger above limits *what* can change)
create policy speech_attempts_update on public.speech_attempts for update to authenticated
  using (public.is_parent_of(child_id))
  with check (public.is_parent_of(child_id));

-- parent may delete (GDPR); child delete cascades
create policy speech_attempts_delete on public.speech_attempts for delete to authenticated
  using (public.is_parent_of(child_id));

-- ---------- Private storage bucket for the raw audio ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'speech', 'speech', false, 10485760,  -- 10 MB cap per clip
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do nothing;

-- Storage RLS: objects live under `<child_id>/…`. The first path segment is the
-- child id, so we can authorise against the family relationship.
create policy "speech upload own child" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'speech'
    and public.is_parent_of(nullif((storage.foldername(name))[1], '')::uuid)
    -- GDPR: no upload without a live recording consent for that child
    and exists (
      select 1 from public.children c
      where c.id = nullif((storage.foldername(name))[1], '')::uuid
        and c.speech_consent_at is not null
    )
  );

create policy "speech read own family" on storage.objects for select to authenticated
  using (
    bucket_id = 'speech'
    and (
      public.is_parent_of(nullif((storage.foldername(name))[1], '')::uuid)
      or public.is_therapist_of(nullif((storage.foldername(name))[1], '')::uuid)
    )
  );

create policy "speech delete own child" on storage.objects for delete to authenticated
  using (
    bucket_id = 'speech'
    and public.is_parent_of(nullif((storage.foldername(name))[1], '')::uuid)
  );
