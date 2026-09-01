-- Noctra core schema: articles, linkages, insights.
-- Nodes are articles; edges are causal linkages discovered by the pipeline.

create extension if not exists vector;

create table public.articles (
  id           bigint generated always as identity primary key,
  title        text not null unique,
  url          text,
  domain       text,
  published_at timestamptz,
  content      text,
  summary      jsonb,          -- executive_summary + swot / pest / diamond_e
  embedding    vector(1536),   -- text-embedding-3-small
  embedded_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index articles_embedding_idx on public.articles
  using hnsw (embedding vector_cosine_ops);
create index articles_published_at_idx on public.articles (published_at desc);

create table public.linkages (
  id          bigint generated always as identity primary key,
  source_id   bigint not null references public.articles(id) on delete cascade,
  target_id   bigint not null references public.articles(id) on delete cascade,
  similarity  real not null,   -- step 1, cosine
  strength    real,            -- step 2, LLM 0-1
  explanation text,            -- step 2, why they are linked
  verified    boolean not null default false,
  is_linked   boolean not null default false,
  model_used  text,
  created_at  timestamptz not null default now(),
  constraint linkage_no_self check (source_id <> target_id)
);

-- One edge per pair in either direction, while source -> target keeps its
-- causal meaning (source = triggering event, target = ripple effect).
create unique index linkage_pair_unique on public.linkages
  (least(source_id, target_id), greatest(source_id, target_id));

create index linkages_source_idx on public.linkages (source_id) where is_linked;
create index linkages_target_idx on public.linkages (target_id) where is_linked;

create table public.article_insights (
  article_id    bigint primary key references public.articles(id) on delete cascade,
  event_summary text,
  predictions   jsonb,
  generated_at  timestamptz not null default now()
);
