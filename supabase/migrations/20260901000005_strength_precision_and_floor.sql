-- 1. Widen strength/similarity from real to double precision.
--
-- float4 cannot represent 0.35 exactly: it round-trips as 0.34999999403953552,
-- so `where strength >= 0.35` silently excluded four of six real links. The LLM
-- returns JSON doubles, so store doubles. Existing rows are rounded back to the
-- two decimals the model actually emitted.
alter table public.linkages
  alter column strength   type double precision using round(strength::numeric, 4)::double precision,
  alter column similarity type double precision using round(similarity::numeric, 6)::double precision;

-- 2. Hide weak links behind a tunable floor.
create or replace function public.get_graph(
  p_days         int    default 7,
  p_node_limit   int    default 10,
  p_min_strength double precision default 0.4
)
returns jsonb
language sql
stable
set search_path = public
as $$
with windowed as (
  select id from public.articles
  where published_at >= now() - make_interval(days => p_days)
),
edges as (
  select l.*
  from public.linkages l
  join windowed s on s.id = l.source_id
  join windowed t on t.id = l.target_id
  where l.is_linked
    and coalesce(l.strength, 0) >= p_min_strength
),
degrees as (
  select article_id, count(*) as deg
  from (
    select source_id as article_id from edges
    union all
    select target_id from edges
  ) both_ends
  group by article_id
),
top_nodes as (
  select a.*, d.deg as degree
  from public.articles a
  join windowed w on w.id = a.id
  join degrees d on d.article_id = a.id      -- inner join: orphans excluded
  order by d.deg desc, a.published_at desc
  limit p_node_limit
),
kept_edges as (
  select e.*
  from edges e
  join top_nodes s on s.id = e.source_id
  join top_nodes t on t.id = e.target_id
)
select jsonb_build_object(
  'nodes', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',   n.id::text,
      'type', 'articleNode',
      'data', jsonb_build_object(
        'title',       n.title,
        'url',         n.url,
        'domain',      n.domain,
        'publishedAt', n.published_at,
        'summary',     n.summary,
        'degree',      n.degree,
        'insight', (
          select jsonb_build_object(
            'eventSummary', i.event_summary,
            'predictions',  i.predictions
          )
          from public.article_insights i
          where i.article_id = n.id
        )
      )
    ))
    from top_nodes n
  ), '[]'::jsonb),
  'edges', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',     e.source_id::text || '-' || e.target_id::text,
      'source', e.source_id::text,
      'target', e.target_id::text,
      'data', jsonb_build_object(
        'strength',    e.strength,
        'explanation', e.explanation
      )
    ))
    from kept_edges e
  ), '[]'::jsonb)
);
$$;

grant execute on function public.get_graph(int, int, double precision) to anon, authenticated;
