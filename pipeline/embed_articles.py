"""Embed title + executive summary for articles that lack an embedding.

Deliberately not the raw content: the headline plus the two-sentence summary is
a sharper signal for "what event is this" than the full body, and it costs a
fraction as much to embed.
"""

import argparse
from datetime import datetime, timezone

from common import EMBEDDING_MODEL, openai, supabase


def embed_input(row):
    summary = row.get("summary") or {}
    executive = summary.get("executive_summary") or ""
    return f"{row['title']}\n\n{executive}".strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100, help="articles per run")
    args = parser.parse_args()

    db, client = supabase(), openai()
    pending = (
        db.table("articles")
        .select("id,title,summary")
        .is_("embedding", "null")
        .not_.is_("summary", "null")
        .order("published_at", desc=True)
        .limit(args.limit)
        .execute()
        .data
    )

    if not pending:
        print("nothing to embed")
        return

    response = client.embeddings.create(
        model=EMBEDDING_MODEL, input=[embed_input(row) for row in pending]
    )
    now = datetime.now(timezone.utc).isoformat()

    for row, item in zip(pending, response.data):
        db.table("articles").update(
            {"embedding": item.embedding, "embedded_at": now}
        ).eq("id", row["id"]).execute()

    print(f"embedded {len(pending)} articles")


if __name__ == "__main__":
    main()
