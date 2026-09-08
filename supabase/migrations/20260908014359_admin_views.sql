-- Read models for the admin page.
--
-- Both are SECURITY DEFINER and both open with an is_admin() guard, because a
-- definer function with no guard is a hole straight through RLS. They are the
-- only way the admin UI reads unpublished state -- draft rows, rejected edges,
-- pipeline gaps -- none of which any public policy exposes.


-- ---------------------------------------------------------------------------
-- Pipeline health: what ran, what it left behind, and where it is stuck.
--
-- The counts are the failure modes the config comments were reverse-engineered
-- from: articles that never got a summary, articles that never got an
-- embedding, and the strength histogram that revealed the 0.35 spike.
-- ---------------------------------------------------------------------------

create or replace function public.get_pipeline_health()
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

  select jsonb_build_object(
    'articles', (
      select jsonb_build_object(
        'total',           count(*),
        'awaitingSummary', count(*) filter (where summary is null),
        'awaitingEmbed',   count(*) filter (where embedding is null),
        'last24h',         count(*) filter (where created_at >= now() - interval '24 hours'),
        'newestPublished', max(published_at),
        'lastWrite',       max(created_at)
      ) from public.articles
    ),
    'linkages', (
      select jsonb_build_object(
        'total',      count(*),
        'linked',     count(*) filter (where is_linked),
        'rejected',   count(*) filter (where verified and not is_linked),
        'aboveFloor', count(*) filter (
          where is_linked and coalesce(strength, 0) >= (
            select (value #>> '{}')::double precision
            from public.settings where key = 'min_link_strength'
          )
        ),
        'lastWrite',  max(created_at)
      ) from public.linkages
    ),
    'insights', (
      select jsonb_build_object(
        'total',     count(*),
        'lastWrite', max(generated_at)
      ) from public.article_insights
    ),
    -- Buckets the accepted band at the resolution the model actually emits.
    -- A spike in one bucket means the floor is a coin-flip, not a filter.
    'strengthHistogram', coalesce((
      select jsonb_agg(bucket order by bucket->>'floor')
      from (
        select jsonb_build_object(
          'floor', to_char(floor(strength * 10) / 10, 'FM0.0'),
          'count', count(*)
        ) as bucket
        from public.linkages
        where is_linked and strength is not null
        group by floor(strength * 10) / 10
      ) buckets
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.get_pipeline_health() from public, anon;
grant execute on function public.get_pipeline_health() to authenticated;


-- ---------------------------------------------------------------------------
-- Every edge in the window, including the ones the public graph hides:
-- below-floor, rejected, and orphaned. Curation is mostly about the rows
-- get_graph refuses to draw, so the admin list cannot reuse it.
-- ---------------------------------------------------------------------------

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

  select coalesce(jsonb_agg(row_to_json(e) order by e.created_at desc), '[]'::jsonb)
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
    order by l.created_at desc
    limit p_limit
  ) e;

  return result;
end;
$$;

revoke execute on function public.get_admin_linkages(int, int) from public, anon;
grant execute on function public.get_admin_linkages(int, int) to authenticated;
