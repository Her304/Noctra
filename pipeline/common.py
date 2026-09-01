"""Shared configuration for the Noctra pipeline.

Runs on GitHub Actions cron, not Vercel: scraping plus AI analysis exceeds
Hobby's 60s function limit, and trafilatura's lxml dependency is heavy against
the serverless bundle cap.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from supabase import Client, create_client

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
    """Service-role client. Bypasses RLS, so this key must stay in CI secrets."""
    try:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    except KeyError as missing:
        raise SystemExit(f"missing required environment variable: {missing}") from None
    return create_client(url, key)


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
