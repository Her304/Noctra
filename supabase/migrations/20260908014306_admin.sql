-- The admin role: a signed-in user on an explicit allowlist.
--
-- Admin is a row in user_roles, not a claim the client can assert. The browser
-- decides nothing here -- every write is re-checked in the database against
-- auth.uid(), so a forged cookie or a hand-rolled request against the REST API
-- gets the same answer as the UI.

create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin')),
  granted_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;


-- ---------------------------------------------------------------------------
-- is_admin()
--
-- SECURITY DEFINER so the function reads user_roles with the owner's rights.
-- That is what stops the infinite recursion this would otherwise cause: the
-- policies on user_roles call is_admin(), and if the function were INVOKER it
-- would re-enter those same policies to answer the question.
--
-- search_path is pinned because a SECURITY DEFINER function without one is
-- hijackable by a caller-controlled search_path.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------------
-- Who can see the allowlist
--
-- A user may read their own row -- the admin UI needs it to decide whether to
-- render at all. Admins may read the whole table. Nobody writes it through the
-- API: granting admin is a SQL-editor act, so privilege escalation is not
-- reachable from a compromised session.
-- ---------------------------------------------------------------------------

create policy "read own role" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

create policy "admins read all roles" on public.user_roles
  for select to authenticated using (public.is_admin());

revoke insert, update, delete, truncate on public.user_roles from anon, authenticated;


-- ---------------------------------------------------------------------------
-- Admin write policies
--
-- INSERT and UPDATE only, matching the pipeline. Curation is corrective, never
-- destructive: a bad edge is retired with is_linked = false, and the model's
-- original strength and explanation stay on the row as evidence.
--
-- `select auth.uid()` rather than a bare call so the planner hoists it to an
-- InitPlan and evaluates it once per statement instead of once per row.
-- ---------------------------------------------------------------------------

create policy "admin insert" on public.articles
  for insert to authenticated with check (public.is_admin());
create policy "admin update" on public.articles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin insert" on public.linkages
  for insert to authenticated with check (public.is_admin());
create policy "admin update" on public.linkages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin insert" on public.article_insights
  for insert to authenticated with check (public.is_admin());
create policy "admin update" on public.article_insights
  for update to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------------
-- Grant yourself admin after signing in once with GitHub:
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com';
--
-- The first sign-in has to happen before this row can exist, so expect the
-- admin page to bounce you back to /login exactly once.
-- ---------------------------------------------------------------------------
