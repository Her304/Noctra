# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Review Behaviour — IMPORTANT

When the user shares code for review or inspection:
- **Do NOT modify it.** Never edit, rewrite, or fix the code unless the user explicitly asks.
- If there are errors or issues, **state them clearly** and provide a guide on how to fix each one — what the problem is, where it is, and what the correct approach should be.
- Only write or change code when the user directly instructs it.

## Project

Noctra is a Decision Engine on **Next.js (App Router) + Supabase**, deployed on Vercel's free tier.
Three public pages — **Apercu** (news analysis), **Catographic** (event-relationship graph), and
**Enchufar** (drag-and-drop analysis workspace, not yet built) — plus **/admin**, a private
observatory floor for pipeline health, linkage curation, article corrections and graph tuning.

## Architecture

Three services, split by what each is good at:

| Component | Runs on | Notes |
|---|---|---|
| Next.js app (`app/`, `components/`, `lib/`) | Vercel Hobby | Server Components read Supabase directly; no API routes |
| Python pipeline (`pipeline/`) | GitHub Actions cron, hourly | Scraping + AI exceeds Vercel's 60s function cap, and trafilatura's lxml is heavy against the bundle limit |
| Postgres + pgvector | Supabase | `articles`, `linkages`, `article_insights` |

The Django backend (`backend/`) and Vite frontend (`frontend/`) are **superseded**. They will be deleted
once the new Next.js stack is verified live on Vercel. Also delete: `Dockerfile`, `docker-compose.yml`,
`requirements.txt`, `start_local.sh`, the root `.env`, `google-cloud-sdk/`, and the `google-cloud-cli-darwin-arm.tar.gz` tarball (60 MB).

## Database

Supabase project `rgcdkmilchxbchpotsrs`. Schema lives in `supabase/migrations/`.

- `articles` — title (unique), url, domain, published_at, content, `summary` **jsonb**, `embedding` vector(1536)
- `linkages` — source (trigger) → target (ripple effect), similarity, strength, explanation, verified, is_linked
- `article_insights` — event_summary, predictions jsonb

Two RPCs: `match_articles(...)` for vector candidate search, `get_graph(p_days, p_node_limit)`
which returns React-Flow-shaped `{nodes, edges}` in one round trip.

### Roles

Three roles, enforced by **grants first, RLS second** — the policy is never the only lock.

| Role | Who | May |
|---|---|---|
| `anon` | the public, browser bundle | `SELECT` only. No INSERT/UPDATE/DELETE/TRUNCATE grant at all |
| `pipeline_writer` | the Python pipeline | `SELECT` + `INSERT`, column-scoped `UPDATE` on articles/insights. **No UPDATE on linkages, no DELETE anywhere** |
| `authenticated` + `is_admin()` | the admin | `SELECT` + `INSERT` + `UPDATE`. **No DELETE** |

**Nothing deletes through the API.** `DELETE` and `TRUNCATE` are revoked from every API role,
including `service_role`. Retiring a linkage is `is_linked = false`, which keeps the model's
verdict on the record — and stops `discover_linkages.py` re-paying for a verdict it already has.
Destructive cleanup is a SQL-editor act under the `postgres` role.

`pipeline_writer` is a real Postgres role, not an API key tier. PostgREST reads the `role` claim of
the request JWT and `SET ROLE`s to it, so the pipeline sends `apiKey: <anon>` (gateway admission)
plus `Authorization: Bearer <pipeline token>` (actual authority). **The service-role key is no longer
used anywhere** — it bypassed RLS entirely, which the pipeline never needed.

Admin is a row in `public.user_roles`, checked by the SECURITY DEFINER `is_admin()`. It is not a
claim the client can assert, and there is no API path that writes that table — granting admin is a
SQL-editor act. Signing in with GitHub grants nothing on its own.

`get_pipeline_health()` and `get_admin_linkages()` are SECURITY DEFINER and each open with an
`is_admin()` guard. Supabase's linter flags them as callable by `authenticated`; that is intentional
and the guard is the reason it is safe.

Free-tier Supabase projects **pause after ~7 days idle**; the hourly pipeline keeps it awake.

## Environment variables

`.env.local` for Next.js (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://rgcdkmilchxbchpotsrs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # anon key only — this reaches the browser
```

`pipeline/.env` for the Python pipeline (gitignored, never committed):
```
SUPABASE_URL=https://rgcdkmilchxbchpotsrs.supabase.co
SUPABASE_ANON_KEY=...                 # gateway apiKey only, carries no authority
SUPABASE_PIPELINE_TOKEN=...           # JWT for the pipeline_writer role
OPENAI_API_KEY=...
```

GitHub Actions secrets for scheduled runs: same four as `pipeline/.env`. Never prefix these `NEXT_PUBLIC_`.

Mint the pipeline token once, **locally, never in CI**:
```bash
SUPABASE_JWT_SECRET=... python pipeline/mint_pipeline_token.py --years 5
```
CI holds the *token*, never `SUPABASE_JWT_SECRET`. The secret can mint a `service_role` token, so a
leak of it is a full compromise; a leak of the token is a role that cannot delete a single row.

## Running

```bash
npm run dev              # Next.js on :3000
npm run build            # production build
npm run types            # regenerate lib/database.types.ts from the linked project
```

Pipeline stages are sequential — each consumes what the previous wrote. Use the venv created at `.venv-pipeline`:
```bash
.venv-pipeline/bin/python pipeline/fetch_news.py
.venv-pipeline/bin/python pipeline/analyse_news.py
.venv-pipeline/bin/python pipeline/embed_articles.py
.venv-pipeline/bin/python pipeline/discover_linkages.py --days 7 --max-verify 100
.venv-pipeline/bin/python pipeline/generate_insights.py --top 10
```

All commands read `pipeline/.env`, which must be filled with credentials before running locally. That file is gitignored; it never reaches the repository.

## AI models

| Task | Model | Where |
|---|---|---|
| Executive summary + SWOT + PEST + Diamond-E | `gpt-5.4-mini` | `analyse_news.py` |
| Linkage verification (graph edges) | `o4-mini`, high effort | `discover_linkages.py` |
| Event summary + future predictions | `o4-mini`, high effort | `generate_insights.py` |
| Embeddings | `text-embedding-3-small` (1536d) | `embed_articles.py` |

All model IDs are centralised in `pipeline/common.py` and overridable by env var. They came from
the design board and have been verified with a live completion call: `gpt-5.4-mini`, `o4-mini`, and `text-embedding-3-small` all work on the account's key. Verify by calling, not with `models.retrieve` -- a deprecated id still retrieves fine and 404s only on use.

## Key architectural decisions

- **Server Components over API routes** — pages query Supabase directly; one less hop, and no
  hardcoded backend origin to break in production.
- **React Flow over D3** — nodes are React components, so the analysis card embeds inside the graph.
- **Force-directed layout (d3-force), not dagre** — clusters emerge from the linkage structure.
  Dagre imposed strict left-to-right ranks that become an unreadable ribbon past ~20 nodes.
  Positions settle synchronously in `lib/layout.ts`; ticking inside an animation frame and
  rebuilding the node array each tick defeats React Flow's measurement pass, which keeps nodes
  `visibility:hidden` until measured. For the same reason, focus/expansion state is applied by
  spreading existing nodes through `useNodesState` rather than constructing new node objects.
- **Linkage discovery is all-pairs, NOT similarity-filtered.** Measured on real data, cosine
  similarity is anti-correlated with causal insight: the oil-price -> tyre-input-cost link scored
  0.20 while three unrelated same-sector pairs scored above 0.40. Similarity finds same-topic
  pairs; causation worth surfacing crosses topics. `--max-verify` is the cost ceiling, and
  `--min-similarity` is a floor only (default 0.0). This needs a real prefilter again past ~40
  articles — the promising direction is embedding a causal fingerprint (drivers/exposures)
  rather than prose.
- **The verifier must permit second-order effects.** An earlier strict prompt rejected 12/12
  pairs at strength exactly 0.0. Permitting second-order links while keeping the "same sector"
  and "siblings of a common cause" guards gives clean separation: 99 rejects at 0.0-0.2,
  6 links at 0.35-0.6, no overlap. Borderline pairs near 0.35 do vary between runs.
- **The verifier sees article content, not just the summary.** With summaries alone it rejected
  oil -> hybrid-vehicle demand, because the Toyota summary never mentions fuel.
- **Rejected linkages are stored** (`verified=true, is_linked=false`) so the next run does not
  re-pay for the same negative verdict.
- **Positions are computed client-side** with dagre, keeping `get_graph` pure data.
- **Pages degrade rather than fail** — an unreachable Supabase renders an empty state, so a deploy
  during an outage does not take the site down.
- **Auth exists for admin only.** GitHub OAuth via `@supabase/ssr`, cookie sessions. Public pages
  stay session-less and prerendered — binding them to a visitor's cookies would make them
  uncacheable for no gain. The free/paid limit is still a constant, now read from `settings`.
- **The admin gate is checked three times, on purpose.** `proxy.ts` redirects (convenience only —
  Next.js middleware has been bypassable, CVE-2025-29927), `app/admin/layout.tsx` re-checks
  server-side, and RLS re-checks `is_admin()` in the database. Server Actions each call
  `requireAdmin()` themselves, because an action is a public POST endpoint reachable without ever
  rendering the page that contains it.
- **Graph tunables live in `public.settings`, not code.** `MIN_LINK_STRENGTH` and
  `GRAPH_WINDOW_DAYS` each blanked a public page once, and both needed a deploy to fix while the
  page sat empty. `lib/config.ts` keeps the reasoning and is now the *fallback* — if the settings
  read fails, the constants still render a page.
