-- The anon key ships to the browser, so RLS is required even with auth deferred.
-- Public SELECT only. No insert/update/delete policies exist, so writes are
-- possible solely with the service role key (which bypasses RLS) -- that key
-- lives in GitHub Actions secrets and never reaches the Next.js bundle.

alter table public.articles         enable row level security;
alter table public.linkages         enable row level security;
alter table public.article_insights enable row level security;

create policy "public read" on public.articles
  for select to anon, authenticated using (true);

create policy "public read" on public.linkages
  for select to anon, authenticated using (true);

create policy "public read" on public.article_insights
  for select to anon, authenticated using (true);
