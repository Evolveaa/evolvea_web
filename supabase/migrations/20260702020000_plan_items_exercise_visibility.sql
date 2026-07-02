-- Close a cross-tenant read: plan_items could reference ANY exercise id,
-- and can_access_exercise() then granted SELECT on it via plan membership.
-- A therapist may only assign builtin-active exercises or their own.

drop policy plan_items_insert on public.plan_items;
drop policy plan_items_update on public.plan_items;

create policy plan_items_insert on public.plan_items for insert to authenticated
  with check (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and p.therapist_id = (select auth.uid())
    )
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id
        and ((e.is_builtin and e.is_active) or e.created_by = (select auth.uid()))
    )
  );

create policy plan_items_update on public.plan_items for update to authenticated
  using (exists (
    select 1 from public.plans p
    where p.id = plan_id and p.therapist_id = (select auth.uid())
  ))
  with check (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and p.therapist_id = (select auth.uid())
    )
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id
        and ((e.is_builtin and e.is_active) or e.created_by = (select auth.uid()))
    )
  );
