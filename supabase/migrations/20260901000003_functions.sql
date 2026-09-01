-- Nearest neighbours by cosine similarity. Step 1 of linkage discovery:
-- cheap candidate generation before the expensive LLM verification.
create or replace function public.match_articles(
  p_query_embedding vector(1536),
  p_match_threshold float default 0.35,
  p_match_count     int   default 5,
  p_exclude_id      bigint default null,
  p_days            int   default 7
)
returns table (id bigint, title text, similarity float)
language sql
stable
set search_path = public
as $$
  select a.id,
         a.title,
         1 - (a.embedding <=> p_query_embedding) as similarity
  from public.articles a
  where a.embedding is not null
    and (p_exclude_id is null or a.id <> p_exclude_id)
    and a.published_at >= now() - make_interval(days => p_days)
    and 1 - (a.embedding <=> p_query_embedding) > p_match_threshold
  order by a.embedding <=> p_query_embedding
  limit p_match_count;
$$;


-- The Catographic graph, React Flow shaped, in one round trip.
-- Ranks by edge degree and takes the top p_node_limit: the board's
-- "top 10 events", and the seam where a paid tier later unlocks the full set.
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
  select a.*, coalesce(d.deg, 0) as degree
  from public.articles a
  join windowed w on w.id = a.id
  left join degrees d on d.article_id = a.id
  order by coalesce(d.deg, 0) desc, a.published_at desc
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

grant execute on function public.get_graph(int, int) to anon, authenticated;
grant execute on function public.match_articles(vector, float, int, bigint, int) to service_role;
