-- =============================================================================
-- Security hardening — addresses warnings from Supabase's security advisor
-- after the initial schema + RLS migrations.
-- =============================================================================

-- Fix mutable search_path on the updated_at trigger function.
alter function public.set_updated_at() set search_path = public;

-- The notifications insert policy was USING (true), letting any authenticated
-- caller insert notifications for anyone. Notifications are only ever created
-- server-side via the service-role admin client (which bypasses RLS
-- entirely), so this policy isn't needed and is a real gap — drop it.
drop policy if exists notifications_insert_system on notifications;

-- is_coach()/owns_client()/handle_new_auth_user() are SECURITY DEFINER
-- helpers meant to be called only from inside RLS policies, not exposed as
-- public RPC endpoints. Lock down execution.
revoke execute on function public.is_coach() from public, anon;
revoke execute on function public.owns_client(uuid) from public, anon;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
grant execute on function public.is_coach() to authenticated;
grant execute on function public.owns_client(uuid) to authenticated;

-- Note: is_coach()/owns_client() remain callable by `authenticated` because
-- RLS policies invoke them under the querying user's role — this is
-- required, not an oversight. Both only ever return a boolean.
