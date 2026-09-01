"""Fetch CNBC business headlines into public.articles.

Idempotent by design: CNBC repeats headlines between polls, so the previous
version's plain insert against a unique title raised IntegrityError on the
second run and killed the job. Upsert on title instead.
"""

from datetime import datetime, timezone
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import feedparser

from common import RSS_URL, TIMEZONE, supabase

LIMIT = 15


def published_at(entry):
    parsed = entry.get("published_parsed")
    if not parsed:
        return None
    utc = datetime(*parsed[:6], tzinfo=timezone.utc)
    return utc.astimezone(ZoneInfo(TIMEZONE)).isoformat()


def main():
    feed = feedparser.parse(RSS_URL)
    if getattr(feed, "bozo", 0) and not feed.entries:
        raise SystemExit(f"could not parse feed: {getattr(feed, 'bozo_exception', 'unknown')}")

    rows, seen = [], set()
    for entry in feed.entries[:LIMIT]:
        title, link = entry.get("title"), entry.get("link")
        if not title or title in seen:
            continue
        seen.add(title)
        rows.append(
            {
                "title": title,
                "url": link,
                "domain": urlparse(link).netloc if link else None,
                "published_at": published_at(entry),
            }
        )

    if not rows:
        print("no entries in feed")
        return

    # Only the keys present here are written on conflict, so content, summary
    # and embedding survive on rows that already exist.
    supabase().table("articles").upsert(rows, on_conflict="title").execute()
    print(f"upserted {len(rows)} articles")


if __name__ == "__main__":
    main()
