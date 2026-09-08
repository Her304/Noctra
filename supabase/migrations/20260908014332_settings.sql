-- Graph tunables, moved out of lib/config.ts so they can be corrected without
-- a redeploy.
--
-- These four numbers have already been wrong in production twice -- the 0.4
-- strength floor that hid 12 of 14 edges, and the 7-day graph window that
-- blanked Catographic when a degree-6 hub aged out mid-day. Both were code
-- constants, so both needed a deploy to fix while the page sat empty. The
-- long-form reasoning stays in lib/config.ts; this table holds the value.

create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

alter table public.settings enable row level security;

insert into public.settings (key, value, description) values
  ('min_link_strength', '0.3'::jsonb,
   'Edges below this verifier strength are not drawn. Rejected pairs land at 0.0-0.2; accepted ones spike at 0.35.'),
  ('graph_window_days', '14'::jsonb,
   'Catographic look-back. get_graph needs BOTH endpoints inside the window, so this outlives its most-connected article.'),
  ('apercu_window_days', '7'::jsonb,
   'Apercu look-back. Wider than the old backend''s 24 hours, which left the page empty between crawls.'),
  ('free_tier_node_limit', '10'::jsonb,
   'Nodes drawn for a signed-out visitor. The seam where a paid tier later unlocks the full graph.')
on conflict (key) do nothing;


-- Read by anon: the public pages resolve these at render time.
create policy "public read" on public.settings
  for select to anon, authenticated using (true);

-- Changed by admins only, and only changed -- the key set is fixed by this
-- migration, so there is no INSERT policy and no way to invent a fifth knob
-- from the UI.
create policy "admin update" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke insert, update, delete, truncate on public.settings from anon;
revoke insert, delete, truncate on public.settings from authenticated, service_role;


-- Stamp who changed what. The admin UI never sends these two columns, so they
-- cannot be spoofed by the client.
create or replace function public.settings_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.key        := old.key;   -- the primary key is not editable
  return new;
end;
$$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch
  before update on public.settings
  for each row execute function public.settings_touch();
