-- Order the curation list by what needs curating.
--
-- created_at DESC put the newest rows first, and since discover_linkages.py
-- writes rejects and accepts in the same pass, that meant ~190 rejected pairs
-- ahead of the 8 edges actually on the graph. The rows an admin came to adjust
-- were below the fold, and the p_limit cut could have dropped them entirely.
--
-- Accepted first, strongest first inside that. The limit now truncates the
-- reject tail rather than the working set.
create or replace function public.get_admin_linkages(
  p_days  int default 14,
  p_limit int default 200
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(row_to_json(e)
      order by e.is_linked desc, e.strength desc nulls last, e.created_at desc),
    '[]'::jsonb)
  into result
  from (
    select l.id,
           l.strength,
           l.similarity,
           l.explanation,
           l.is_linked,
           l.verified,
           l.model_used,
           l.created_at,
           s.id    as source_id,
           s.title as source_title,
           t.id    as target_id,
           t.title as target_title
    from public.linkages l
    join public.articles s on s.id = l.source_id
    join public.articles t on t.id = l.target_id
    where s.published_at >= now() - make_interval(days => p_days)
       or t.published_at >= now() - make_interval(days => p_days)
    order by l.is_linked desc, l.strength desc nulls last, l.created_at desc
    limit p_limit
  ) e;

  return result;
end;
$$;

revoke execute on function public.get_admin_linkages(int, int) from public, anon;
grant execute on function public.get_admin_linkages(int, int) to authenticated;
