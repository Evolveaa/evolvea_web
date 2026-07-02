-- ============================================================
-- Evolvea — core schema
-- Multi-tenant: therapist ↔ families (parent + child), exercise
-- library, plans, sessions, messaging. RLS everywhere.
-- ============================================================

-- ---------- Enums ----------
create type public.user_role as enum ('parent', 'therapist');

create type public.exercise_domain as enum (
  'phonemic_awareness', -- fonematické uvedomovanie (Eľkonin–Mikulajová)
  'working_memory',     -- pracovná pamäť
  'attention',          -- pozornosť (Achutinová–Pylajeva)
  'narrative',          -- naratívne schopnosti (Ďjačenko–Stanislavová)
  'vocabulary',         -- slovná zásoba a porozumenie
  'articulation',       -- výslovnosť a artikulácia
  'guided'              -- riadené rodič–dieťa, metakognícia (Mikulajová)
);

create type public.exercise_modality as enum (
  'interactive', -- dieťa kliká/ťuká v aplikácii
  'speech',      -- dieťa hovorí, rodič hodnotí
  'guided'       -- vedená spoločná aktivita mimo obrazovky
);

-- ---------- Tables ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'parent',
  full_name  text not null default '' check (char_length(full_name) <= 120),
  locale     text not null default 'sk' check (locale in ('sk', 'en', 'de')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.profiles (id) on delete cascade,
  therapist_id uuid references public.profiles (id) on delete set null,
  -- data minimisation: first name + birth year only, no full identity
  first_name   text not null check (char_length(first_name) between 1 and 60),
  birth_year   int check (birth_year between 2005 and 2030),
  avatar       text not null default '🦊' check (char_length(avatar) <= 8),
  created_at   timestamptz not null default now()
);

create index children_parent_idx on public.children (parent_id);
create index children_therapist_idx on public.children (therapist_id);

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  -- no 0/O/1/I/L to stay unambiguous when read over the phone
  chars  constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

create table public.invites (
  id               uuid primary key default gen_random_uuid(),
  therapist_id     uuid not null references public.profiles (id) on delete cascade,
  code             text not null unique default public.generate_invite_code(),
  child_first_name text not null check (char_length(child_first_name) between 1 and 60),
  child_birth_year int check (child_birth_year between 2005 and 2030),
  note             text check (char_length(note) <= 500),
  created_at       timestamptz not null default now(),
  redeemed_by      uuid references public.profiles (id) on delete set null,
  redeemed_at      timestamptz,
  child_id         uuid references public.children (id) on delete set null
);

create index invites_therapist_idx on public.invites (therapist_id);

create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique, -- stable identifier for built-in library items
  domain           public.exercise_domain not null,
  modality         public.exercise_modality not null,
  title            text not null check (char_length(title) <= 200),
  summary          text not null check (char_length(summary) <= 600),
  parent_guide     text not null default '', -- how the parent scaffolds this exercise
  difficulty       int not null check (difficulty between 1 and 3),
  age_min          int not null default 5 check (age_min between 3 and 15),
  age_max          int not null default 10 check (age_max between 3 and 15),
  duration_minutes int not null default 5 check (duration_minutes between 1 and 60),
  content          jsonb not null, -- data-driven task definition (typed in the app)
  is_builtin       boolean not null default false,
  created_by       uuid references public.profiles (id) on delete cascade,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  check (is_builtin = (created_by is null))
);

create index exercises_domain_idx on public.exercises (domain, difficulty);
create index exercises_created_by_idx on public.exercises (created_by);

create table public.plans (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children (id) on delete cascade,
  therapist_id uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) <= 200),
  note         text check (char_length(note) <= 2000), -- therapist's message to the parent
  status       text not null default 'active' check (status in ('active', 'archived')),
  created_at   timestamptz not null default now()
);

create index plans_child_idx on public.plans (child_id);
create index plans_therapist_idx on public.plans (therapist_id);

create table public.plan_items (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.plans (id) on delete cascade,
  exercise_id    uuid not null references public.exercises (id) on delete restrict,
  sort_order     int not null default 0,
  times_per_week int not null default 2 check (times_per_week between 1 and 7),
  -- Vygotskian scaffolding: 3 = full parent support, 2 = partial, 1 = independent
  support_level  int not null default 3 check (support_level between 1 and 3)
);

create index plan_items_plan_idx on public.plan_items (plan_id, sort_order);
create index plan_items_exercise_idx on public.plan_items (exercise_id);

create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  child_id         uuid not null references public.children (id) on delete cascade,
  exercise_id      uuid not null references public.exercises (id) on delete restrict,
  plan_item_id     uuid references public.plan_items (id) on delete set null,
  support_level    int not null default 3 check (support_level between 1 and 3),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  duration_seconds int check (duration_seconds >= 0),
  score_correct    int check (score_correct >= 0),
  score_total      int check (score_total >= 0),
  hints_used       int not null default 0 check (hints_used >= 0),
  detail           jsonb, -- per-item results / reflection answers
  parent_note      text check (char_length(parent_note) <= 2000)
);

create index sessions_child_idx on public.sessions (child_id, started_at desc);
create index sessions_exercise_idx on public.sessions (exercise_id);
create index sessions_plan_item_idx on public.sessions (plan_item_id);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children (id) on delete cascade,
  sender_id  uuid references public.profiles (id) on delete set null,
  kind       text not null default 'message' check (kind in ('message', 'system')),
  body       text not null default '' check (char_length(body) <= 4000),
  meta       jsonb, -- system events: {"event": "plan_assigned", ...}
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index messages_child_idx on public.messages (child_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id);

-- ---------- Helper functions (security definer → no RLS recursion) ----------
create or replace function public.my_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_parent_of(p_child uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from children c
    where c.id = p_child and c.parent_id = auth.uid()
  );
$$;

create or replace function public.is_therapist_of(p_child uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from children c
    where c.id = p_child and c.therapist_id = auth.uid()
  );
$$;

create or replace function public.shares_child(p_profile uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from children c
    where (c.parent_id = auth.uid() and c.therapist_id = p_profile)
       or (c.therapist_id = auth.uid() and c.parent_id = p_profile)
  );
$$;

create or replace function public.can_access_exercise(p_exercise uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from plan_items pi
    join plans p on p.id = pi.plan_id
    join children c on c.id = p.child_id
    where pi.exercise_id = p_exercise
      and (c.parent_id = auth.uid() or c.therapist_id = auth.uid())
  );
$$;

-- ---------- Triggers ----------
-- profile bootstrap on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, locale)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'therapist'
         then 'therapist'::public.user_role
         else 'parent'::public.user_role end,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    case when new.raw_user_meta_data ->> 'locale' in ('sk', 'en', 'de')
         then new.raw_user_meta_data ->> 'locale' else 'sk' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- profiles: role is immutable for end users, keep updated_at fresh
create or replace function public.protect_profile_update()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'role is immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_update
  before update on public.profiles
  for each row execute procedure public.protect_profile_update();

-- children: family links cannot be rewritten by clients
create or replace function public.protect_child_update()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if new.parent_id is distinct from old.parent_id then
    raise exception 'parent link is immutable';
  end if;
  if new.therapist_id is distinct from old.therapist_id then
    if not (old.therapist_id = auth.uid() and new.therapist_id is null) then
      raise exception 'only the linked therapist may end care';
    end if;
  end if;
  return new;
end;
$$;

create trigger children_protect_update
  before update on public.children
  for each row execute procedure public.protect_child_update();

-- messages: updates may only flip the read receipt, and never by the sender
create or replace function public.protect_message_update()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if new.child_id  is distinct from old.child_id
     or new.sender_id is distinct from old.sender_id
     or new.kind    is distinct from old.kind
     or new.body    is distinct from old.body
     or new.meta    is distinct from old.meta
     or new.created_at is distinct from old.created_at then
    raise exception 'only read receipts may be updated';
  end if;
  if old.sender_id = auth.uid() then
    raise exception 'cannot mark own message as read';
  end if;
  return new;
end;
$$;

create trigger messages_protect_update
  before update on public.messages
  for each row execute procedure public.protect_message_update();

-- assigning a plan notifies the family (system message)
create or replace function public.notify_plan_assigned()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.messages (child_id, sender_id, kind, body, meta)
  values (
    new.child_id, new.therapist_id, 'system', '',
    jsonb_build_object('event', 'plan_assigned', 'plan_title', new.title)
  );
  return new;
end;
$$;

create trigger plans_notify_assigned
  after insert on public.plans
  for each row execute procedure public.notify_plan_assigned();

-- ---------- Invite redemption (the only way to create a child) ----------
create or replace function public.redeem_invite(p_code text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
  v_child_id uuid;
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'parent'::public.user_role then
    raise exception 'only_parent';
  end if;

  select * into v_invite
  from invites
  where code = upper(regexp_replace(p_code, '\s', '', 'g'))
    and redeemed_at is null
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  insert into children (parent_id, therapist_id, first_name, birth_year)
  values (auth.uid(), v_invite.therapist_id, v_invite.child_first_name, v_invite.child_birth_year)
  returning id into v_child_id;

  update invites
  set redeemed_by = auth.uid(), redeemed_at = now(), child_id = v_child_id
  where id = v_invite.id;

  insert into messages (child_id, sender_id, kind, body, meta)
  values (v_child_id, v_invite.therapist_id, 'system', '',
          jsonb_build_object('event', 'welcome'));

  return v_child_id;
end;
$$;

revoke execute on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- ---------- RLS ----------
alter table public.profiles   enable row level security;
alter table public.children   enable row level security;
alter table public.invites    enable row level security;
alter table public.exercises  enable row level security;
alter table public.plans      enable row level security;
alter table public.plan_items enable row level security;
alter table public.sessions   enable row level security;
alter table public.messages   enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_child(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- children
create policy children_select on public.children for select to authenticated
  using (parent_id = (select auth.uid()) or therapist_id = (select auth.uid()));
create policy children_update on public.children for update to authenticated
  using (parent_id = (select auth.uid()) or therapist_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()) or therapist_id = (select auth.uid()));
create policy children_delete on public.children for delete to authenticated
  using (parent_id = (select auth.uid()));

-- invites (redemption goes through the security-definer RPC)
create policy invites_select on public.invites for select to authenticated
  using (therapist_id = (select auth.uid()));
create policy invites_insert on public.invites for insert to authenticated
  with check (therapist_id = (select auth.uid()) and public.my_role() = 'therapist');
create policy invites_delete on public.invites for delete to authenticated
  using (therapist_id = (select auth.uid()) and redeemed_at is null);

-- exercises
create policy exercises_select on public.exercises for select to authenticated
  using (
    (is_active and (is_builtin or public.can_access_exercise(id)))
    or created_by = (select auth.uid())
  );
create policy exercises_insert on public.exercises for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and is_builtin = false
    and public.my_role() = 'therapist'
  );
create policy exercises_update on public.exercises for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()) and is_builtin = false);
create policy exercises_delete on public.exercises for delete to authenticated
  using (created_by = (select auth.uid()));

-- plans
create policy plans_select on public.plans for select to authenticated
  using (therapist_id = (select auth.uid()) or public.is_parent_of(child_id));
create policy plans_insert on public.plans for insert to authenticated
  with check (therapist_id = (select auth.uid()) and public.is_therapist_of(child_id));
create policy plans_update on public.plans for update to authenticated
  using (therapist_id = (select auth.uid()))
  with check (therapist_id = (select auth.uid()) and public.is_therapist_of(child_id));
create policy plans_delete on public.plans for delete to authenticated
  using (therapist_id = (select auth.uid()));

-- plan_items
create policy plan_items_select on public.plan_items for select to authenticated
  using (exists (
    select 1 from public.plans p
    where p.id = plan_id
      and (p.therapist_id = (select auth.uid()) or public.is_parent_of(p.child_id))
  ));
create policy plan_items_insert on public.plan_items for insert to authenticated
  with check (exists (
    select 1 from public.plans p
    where p.id = plan_id and p.therapist_id = (select auth.uid())
  ));
create policy plan_items_update on public.plan_items for update to authenticated
  using (exists (
    select 1 from public.plans p
    where p.id = plan_id and p.therapist_id = (select auth.uid())
  ));
create policy plan_items_delete on public.plan_items for delete to authenticated
  using (exists (
    select 1 from public.plans p
    where p.id = plan_id and p.therapist_id = (select auth.uid())
  ));

-- sessions
create policy sessions_select on public.sessions for select to authenticated
  using (public.is_parent_of(child_id) or public.is_therapist_of(child_id));
create policy sessions_insert on public.sessions for insert to authenticated
  with check (public.is_parent_of(child_id));
create policy sessions_update on public.sessions for update to authenticated
  using (public.is_parent_of(child_id))
  with check (public.is_parent_of(child_id));
create policy sessions_delete on public.sessions for delete to authenticated
  using (public.is_parent_of(child_id));

-- messages
create policy messages_select on public.messages for select to authenticated
  using (public.is_parent_of(child_id) or public.is_therapist_of(child_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and kind = 'message'
    and (public.is_parent_of(child_id) or public.is_therapist_of(child_id))
  );
create policy messages_update on public.messages for update to authenticated
  using (public.is_parent_of(child_id) or public.is_therapist_of(child_id));
create policy messages_delete on public.messages for delete to authenticated
  using (sender_id = (select auth.uid()));
