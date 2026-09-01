-- Only return articles that actually have a verified linkage.
--
-- The previous version LEFT JOINed degrees and padded up to p_node_limit, so a
-- sparse window returned degree-0 articles that render as disconnected cards
-- floating in the canvas -- the graph looks broken rather than sparse. An inner
-- join drops them, so every node on screen has earned its place.
create or replace function public.get_graph(
  p_days       int default 7,
  p_node_limit int default 10
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
