"""Shared configuration for the Noctra pipeline.

Runs on GitHub Actions cron, not Vercel: scraping plus AI analysis exceeds
Hobby's 60s function limit, and trafilatura's lxml dependency is heavy against
the serverless bundle cap.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
# The top-level ClientOptions, not the one in supabase.lib.client_options --
# only this export carries the sync `storage` field the client constructor
# requires.
from supabase import Client, ClientOptions, create_client

# Deliberately pipeline/.env, not the repo-root .env: Next.js loads the root
# file, and the service-role key bypasses RLS -- it must not enter the web
# app's process at all.
load_dotenv(Path(__file__).parent / ".env")

# Model routing, per the Figma board. Verify each against the OpenAI API before
# the first scheduled run -- these came off the board, not from the API. Verify
# with a real completion, not models.retrieve: a deprecated id still retrieves
# successfully and only 404s when you actually call it.
ANALYSIS_MODEL = os.environ.get("NOCTRA_ANALYSIS_MODEL", "gpt-5.4-mini")
LINKAGE_MODEL = os.environ.get("NOCTRA_LINKAGE_MODEL", "o4-mini")
INSIGHT_MODEL = os.environ.get("NOCTRA_INSIGHT_MODEL", "o4-mini")

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMS = 1536

RSS_URL = "https://www.cnbc.com/id/10001147/device/rss/rss.html"
TIMEZONE = "America/Toronto"


def supabase() -> Client:
    """Client bound to the `pipeline_writer` Postgres role.

    Two headers, two different jobs. `apiKey` carries the anon key, which is
    what the Supabase gateway checks to admit the request at all -- it is public
    and ships in the browser bundle anyway. `Authorization` carries a JWT signed
    for pipeline_writer, and PostgREST SET ROLEs to the `role` claim inside it,
    so the statement runs with exactly the grants that role holds: insert,
    column-scoped update, and no DELETE on any table.

    This replaces the service-role key, which bypassed RLS entirely. The
    pipeline never needed that much authority -- it appends rows and fills in
    columns -- and a scheduled job holding a key that can drop the database is a
    blast radius with no upside. Mint the token with mint_pipeline_token.py.
    """
    try:
        url = os.environ["SUPABASE_URL"]
        anon_key = os.environ["SUPABASE_ANON_KEY"]
        token = os.environ["SUPABASE_PIPELINE_TOKEN"]
    except KeyError as missing:
        # Deliberately fatal rather than falling back to the service-role key:
        # a silent fallback would mean the pipeline keeps running with full
        # RLS-bypassing authority and nobody ever notices the lockdown failed.
        raise SystemExit(
            f"missing required environment variable: {missing}\n\n"
            "The pipeline now runs as the `pipeline_writer` role instead of\n"
            "service_role. Mint its token once, locally:\n\n"
            "    SUPABASE_JWT_SECRET=... python pipeline/mint_pipeline_token.py\n\n"
            "then set SUPABASE_PIPELINE_TOKEN (plus SUPABASE_URL and\n"
            "SUPABASE_ANON_KEY) in pipeline/.env and as GitHub repo secrets."
        ) from None

    # supabase-py falls back to signing requests with the apiKey when no
    # Authorization header is supplied; supplying one also short-circuits the
    # session lookup it would otherwise attempt on create().
    return create_client(
        url,
        anon_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {token}"}),
    )


def openai() -> OpenAI:
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("missing required environment variable: 'OPENAI_API_KEY'")
    return OpenAI()


# o4-mini is a reasoning model; the board calls for high effort when defining
# graph edges. Set NOCTRA_REASONING_EFFORT="" to omit the parameter entirely,
# which is what a non-reasoning model needs.
REASONING_EFFORT = os.environ.get("NOCTRA_REASONING_EFFORT", "high")


def reasoning_kwargs() -> dict:
    return {"reasoning_effort": REASONING_EFFORT} if REASONING_EFFORT else {}
