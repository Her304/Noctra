# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Review Behaviour — IMPORTANT

When the user shares code for review or inspection:
- **Do NOT modify it.** Never edit, rewrite, or fix the code unless the user explicitly asks.
- If there are errors or issues, **state them clearly** and provide a guide on how to fix each one — what the problem is, where it is, and what the correct approach should be.
- Only write or change code when the user directly instructs it.

## Project

Noctra is a Decision Engine built on Flask (backend) + React/Vite (frontend). It has three pages — **Apercu** (free news analysis), **Catographic** (paid knowledge graph), and **Enchufar** (paid drag-and-drop analysis workspace). See `plan.md` for the full build plan and `plan.md#database-structure` for the schema.

## Current State

The project is in early scaffolding. What exists:
- `app.py` — bare Flask stub, needs to be rebuilt as an app factory
- `News-catch.py` — GDELT news fetcher, has known errors (see code review in conversation), Django references not yet removed
- `News_html.py` — HTML scraper + OpenAI analysis, still Django-coupled
- `database.db` — empty SQLite file, used as the dev database

The planned folder structure (not yet created) is `backend/` for Flask and `frontend/` for React.


## Environment Variables

Create a `.env` file in the project root:

```
OPENAI_API_KEY=...
News_catch_api=...      # Newsdata.io API key used in News-catch.py
```

`python-dotenv` is used — `load_dotenv()` is called at the top of each script.

## Database

**Dev:** Local PostgreSQL 14 (Homebrew), database `noctra`, user `crawler_service` (trust auth — no password needed). The `NewsArticle` model maps to `news.apercu`.
**Production:** Google Cloud SQL PostgreSQL at `34.134.226.122`, same user/credentials stored in `.env`.

The `.env` at the project root controls which DB is active — `DB_HOST`/`CRAWLER_DB_HOST` switch between `localhost` (dev) and the Cloud SQL IP (prod).

### Starting dev

```bash
./start_local.sh
```

Checks if PostgreSQL is running, starts it via `brew services start postgresql@14` if not, then launches the Django dev server with the venv activated.

## AI Models

| Task | Model |
|---|---|
| SWOT + Diamond E + Executive Summary | GPT-4.1-mini (batch, post-scrape) |
| Linkage mapping + event predictions | o4-mini, high effort (background) |
| Custom user analysis (Enchufar) | o4-mini, medium effort (real-time) |
| Supplementary fetch for weak links | 4o Search Preview (conditional) |

## Key Architectural Decisions

- **Flask app factory pattern** — `backend/app/__init__.py` creates the app; routes are registered as blueprints per page.
- **React Flow over D3** — graph nodes are React components, so SWOT/analysis cards embed directly inside the Catographic graph.
- **Two-step linkage pipeline** — vector cosine similarity (pgvector, cheap) finds candidates first; o4-mini verifies only those candidates (expensive). Keeps AI costs controlled.
- **SQLAlchemy for all DB access** — never use raw `sqlite3` in new code; SQLAlchemy abstracts the dev/prod database difference.
- **Phase 2 stores data in SQLite** — the in-memory/JSON-file approach was dropped in favour of SQLite from the start so Phase 7 is purely a migration, not a rewrite.
