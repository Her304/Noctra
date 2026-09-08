-- Three roles, enforced at the privilege level as well as the policy level.
--
--   public  (anon)            -- SELECT only. Ships in the browser bundle.
--   system  (pipeline_writer) -- INSERT + scoped UPDATE. Never DELETE.
--   admin   (authenticated)   -- INSERT + UPDATE, gated by is_admin(). Never DELETE.
--
-- Why grants and not just RLS: 20260901000002_rls.sql relied entirely on the
-- absence of a policy to stop writes. That is one mistake deep -- a single
-- permissive policy, or `alter table ... disable row level security`, and the
-- anon key in the browser bundle inherits Supabase's default grants, which
-- include DELETE and TRUNCATE on every table. Revoking the privilege means the
-- policy is a second lock rather than the only one.


-- ---------------------------------------------------------------------------
-- public: read-only, at the privilege level
-- ---------------------------------------------------------------------------

revoke insert, update, delete, truncate
  on public.articles, public.linkages, public.article_insights
  from anon;


-- ---------------------------------------------------------------------------
-- Nobody deletes through the API. Not the public, not the pipeline, not an
-- admin. Curation retires a linkage by setting is_linked = false, which keeps
-- the model's original verdict on the record instead of erasing it.
--
-- Destructive cleanup is deliberately a SQL-editor operation under the
-- `postgres` role, where it is a conscious act rather than a loose privilege.
-- service_role is included so the old CI key cannot destroy anything even
-- before it is rotated out.
-- ---------------------------------------------------------------------------

revoke delete, truncate
  on public.articles, public.linkages, public.article_insights
  from authenticated, service_role;


-- ---------------------------------------------------------------------------
-- system: the pipeline's own Postgres role
--
-- PostgREST reads the `role` claim of the request JWT and SET ROLEs to it, so
-- a token signed for pipeline_writer gets exactly these privileges -- unlike
-- the service_role key it replaces, which bypasses RLS entirely and could drop
-- every row in the database if it ever leaked out of GitHub Actions.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'pipeline_writer') then
    create role pipeline_writer nologin noinherit;
  end if;
end
$$;

-- Lets PostgREST's connection role assume it for the duration of a request.
grant pipeline_writer to authenticator;
grant usage on schema public to pipeline_writer;

-- Reads: every stage selects its pending rows before writing.
grant select on public.articles, public.linkages, public.article_insights
  to pipeline_writer;

-- Writes: fetch_news upserts articles, discover_linkages inserts edges,
-- generate_insights upserts insights.
grant insert on public.articles, public.linkages, public.article_insights
  to pipeline_writer;

-- analyse_news writes content+summary, embed_articles writes embedding+
-- embedded_at, and fetch_news's upsert re-sets the identifying columns on
-- conflict. Column-scoped so the pipeline cannot reach id or created_at:
-- article identity and arrival time are not the pipeline's to rewrite.
--
-- `title` is here only because PostgREST compiles upsert to
-- ON CONFLICT (title) DO UPDATE SET title = excluded.title, ... -- the write is
-- a no-op against the conflict target, but the privilege is still required.
grant update (title, url, domain, published_at, content, summary, embedding, embedded_at)
  on public.articles to pipeline_writer;

grant update (event_summary, predictions, generated_at)
  on public.article_insights to pipeline_writer;

-- linkages is insert-only for the pipeline. A verdict, once recorded, is
-- revised by an admin, not silently by the next run.
-- (no `grant update` on public.linkages)

-- Candidate generation for discover_linkages, previously granted to
-- service_role in 20260901000003_functions.sql.
grant execute on function
  public.match_articles(vector, float, int, bigint, int) to pipeline_writer;


-- ---------------------------------------------------------------------------
-- RLS policies for the system role
--
-- pipeline_writer is an ordinary role, so RLS applies to it in full. Without
-- these policies every grant above would still be refused.
-- ---------------------------------------------------------------------------

create policy "system read" on public.articles
  for select to pipeline_writer using (true);
create policy "system insert" on public.articles
  for insert to pipeline_writer with check (true);
create policy "system update" on public.articles
  for update to pipeline_writer using (true) with check (true);

create policy "system read" on public.linkages
  for select to pipeline_writer using (true);
create policy "system insert" on public.linkages
  for insert to pipeline_writer with check (true);

create policy "system read" on public.article_insights
  for select to pipeline_writer using (true);
create policy "system insert" on public.article_insights
  for insert to pipeline_writer with check (true);
create policy "system update" on public.article_insights
  for update to pipeline_writer using (true) with check (true);
