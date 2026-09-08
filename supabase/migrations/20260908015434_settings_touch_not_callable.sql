-- settings_touch() is a trigger function, but a SECURITY DEFINER function in
-- the public schema is also reachable at /rest/v1/rpc/settings_touch. Calling
-- a trigger function outside a trigger errors, so this is tidiness rather than
-- a live hole -- but a definer function nobody should call should not be
-- callable. Flagged by the Supabase linter as
-- anon_security_definer_function_executable.
revoke execute on function public.settings_touch() from public, anon, authenticated;
