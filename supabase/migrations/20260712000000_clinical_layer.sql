-- Clinical layer: therapy goals, private clinical notes, plan templates.
-- Goals are visible to the parent (transparency about what we work on);
-- notes are strictly private to the authoring therapist; templates are
-- private re-usable plan bundles.

-- ---------- goals ----------
create table public.goals (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  therapist_id  uuid not null references public.profiles (id) on delete cascade,
  domain        public.exercise_domain not null,
  title         text not null check (char_length(title) <= 300),
  target_pct    int check (target_pct between 1 and 100),
  target_date   date,
  baseline_pct  int check (baseline_pct between 0 and 100),
  status        text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  created_at    timestamptz not null default now(),
  achieved_at   timestamptz
);

create index goals_child_idx on public.goals (child_id, status);
create index goals_therapist_idx on public.goals (therapist_id);

alter table public.goals enable row level security;

create policy goals_select on public.goals for select to authenticated
  using (therapist_id = (select auth.uid()) or public.is_parent_of(child_id));
create policy goals_insert on public.goals for insert to authenticated
  with check (therapist_id = (select auth.uid()) and public.is_therapist_of(child_id));
create policy goals_update on public.goals for update to authenticated
  using (therapist_id = (select auth.uid()))
  with check (therapist_id = (select auth.uid()) and public.is_therapist_of(child_id));
create policy goals_delete on public.goals for delete to authenticated
  using (therapist_id = (select auth.uid()));

-- ---------- therapist_notes (private clinical journal) ----------
create table public.therapist_notes (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  therapist_id  uuid not null references public.profiles (id) on delete cascade,
  body          text not null check (char_length(body) <= 8000),
  noted_on      date not null default current_date,
  created_at    timestamptz not null default now()
);

create index therapist_notes_child_idx on public.therapist_notes (child_id, noted_on desc);

alter table public.therapist_notes enable row level security;

-- Private to the authoring therapist — the parent never sees these.
create policy therapist_notes_select on public.therapist_notes for select to authenticated
  using (therapist_id = (select auth.uid()));
create policy therapist_notes_insert on public.therapist_notes for insert to authenticated
  with check (therapist_id = (select auth.uid()) and public.is_therapist_of(child_id));
create policy therapist_notes_update on public.therapist_notes for update to authenticated
  using (therapist_id = (select auth.uid()))
  with check (therapist_id = (select auth.uid()));
create policy therapist_notes_delete on public.therapist_notes for delete to authenticated
  using (therapist_id = (select auth.uid()));

-- ---------- plan_templates ----------
-- items: jsonb array of { exercise_id, times_per_week, support_level };
-- exercises referenced by a template may disappear later — the UI filters
-- missing ids gracefully, same as plan editing does.
create table public.plan_templates (
  id            uuid primary key default gen_random_uuid(),
  therapist_id  uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) <= 200),
  description   text check (char_length(description) <= 600),
  items         jsonb not null,
  created_at    timestamptz not null default now()
);

create index plan_templates_owner_idx on public.plan_templates (therapist_id, created_at desc);

alter table public.plan_templates enable row level security;

create policy plan_templates_select on public.plan_templates for select to authenticated
  using (therapist_id = (select auth.uid()));
create policy plan_templates_insert on public.plan_templates for insert to authenticated
  with check (therapist_id = (select auth.uid()));
create policy plan_templates_update on public.plan_templates for update to authenticated
  using (therapist_id = (select auth.uid()))
  with check (therapist_id = (select auth.uid()));
create policy plan_templates_delete on public.plan_templates for delete to authenticated
  using (therapist_id = (select auth.uid()));
