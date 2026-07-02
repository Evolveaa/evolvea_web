-- Advisor fixes: pin search_path on every function, strip RPC access that
-- clients do not need. Policy helper functions must stay executable by
-- `authenticated` (RLS expressions run with the caller's privileges).

alter function public.generate_invite_code() set search_path = public;
alter function public.protect_profile_update() set search_path = public;
alter function public.protect_child_update() set search_path = public;
alter function public.protect_message_update() set search_path = public;

-- trigger-only functions: nobody calls these directly
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_plan_assigned() from public, anon, authenticated;
revoke execute on function public.protect_profile_update() from public, anon, authenticated;
revoke execute on function public.protect_child_update() from public, anon, authenticated;
revoke execute on function public.protect_message_update() from public, anon, authenticated;

-- helpers: needed by RLS for signed-in users, never by anon
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.is_parent_of(uuid) from public, anon;
revoke execute on function public.is_therapist_of(uuid) from public, anon;
revoke execute on function public.shares_child(uuid) from public, anon;
revoke execute on function public.can_access_exercise(uuid) from public, anon;
revoke execute on function public.generate_invite_code() from public, anon;
