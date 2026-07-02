-- Per-child subscription: 14-day trial created on invite redemption,
-- activated through the (mock) payment gateway, cancellable by the parent.

create table public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null unique references public.children (id) on delete cascade,
  status        text not null default 'trial' check (status in ('trial', 'active', 'canceled')),
  trial_ends_at timestamptz not null default now() + interval '14 days',
  activated_at  timestamptz,
  canceled_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_parent_of(child_id) or public.is_therapist_of(child_id));
create policy subscriptions_update on public.subscriptions for update to authenticated
  using (public.is_parent_of(child_id))
  with check (public.is_parent_of(child_id));

-- guard: parents may only flip the status along allowed transitions
create or replace function public.protect_subscription_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if new.child_id is distinct from old.child_id
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable subscription fields';
  end if;
  if new.status is distinct from old.status then
    if not (
      (old.status in ('trial', 'canceled') and new.status = 'active')
      or (old.status in ('trial', 'active') and new.status = 'canceled')
    ) then
      raise exception 'invalid status transition';
    end if;
    if new.status = 'active' then
      new.activated_at := coalesce(new.activated_at, now());
    end if;
    if new.status = 'canceled' then
      new.canceled_at := coalesce(new.canceled_at, now());
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_subscription_update() from public, anon, authenticated;

create trigger subscriptions_protect_update
  before update on public.subscriptions
  for each row execute procedure public.protect_subscription_update();

-- redemption now also opens the trial
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

  insert into subscriptions (child_id) values (v_child_id);

  insert into messages (child_id, sender_id, kind, body, meta)
  values (v_child_id, v_invite.therapist_id, 'system', '',
          jsonb_build_object('event', 'welcome'));

  return v_child_id;
end;
$$;
