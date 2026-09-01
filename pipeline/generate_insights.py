"""Event summary and future predictions for the most-connected articles.

These feed the Catographic side panel. The prompt is given each article's
linked neighbours and the stated causal mechanism, so predictions come from the
linkage web rather than the headline alone -- which is the point of the graph.
"""

import argparse
import json
from collections import Counter

from common import INSIGHT_MODEL, openai, reasoning_kwargs, supabase

PROMPT = """You are briefing an executive on a developing business situation.

CENTRAL EVENT: {title}
{summary}

CONNECTED EVENTS AND THEIR CAUSAL LINKS:
{neighbours}

Respond with JSON in exactly this shape:
{{
  "event_summary": "a short paragraph on what is actually happening and why it matters now",
  "predictions": [
    {{"horizon": "weeks" or "months", "claim": "a specific, falsifiable prediction", "confidence": 0.0 to 1.0}}
  ]
}}

Give two to four predictions grounded in the connections above. Prefer specific
and checkable over broad and safe."""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--top", type=int, default=10, help="most-connected articles to brief")
    args = parser.parse_args()

    db, client = supabase(), openai()

    edges = (
        db.table("linkages")
        .select("source_id,target_id,explanation,strength")
        .eq("is_linked", True)
        .execute()
        .data
    )
    if not edges:
        print("no linkages yet -- run discover_linkages.py first")
        return

    degree = Counter()
    for edge in edges:
        degree[edge["source_id"]] += 1
        degree[edge["target_id"]] += 1

    ranked = [article_id for article_id, _ in degree.most_common(args.top)]
    done = {
        row["article_id"]
        for row in db.table("article_insights")
        .select("article_id")
        .in_("article_id", ranked)
        .execute()
        .data
    }
    todo = [article_id for article_id in ranked if article_id not in done]

    if not todo:
        print("all top articles already have insights")
        return

    articles = {
        row["id"]: row
        for row in db.table("articles")
        .select("id,title,summary")
        .in_("id", ranked)
        .execute()
        .data
    }

    print(f"briefing {len(todo)} articles with {INSIGHT_MODEL}")
    for article_id in todo:
        article = articles.get(article_id)
        if not article:
            continue
        try:
            lines = []
            for edge in edges:
                if article_id not in (edge["source_id"], edge["target_id"]):
                    continue
                other_id = (
                    edge["target_id"] if edge["source_id"] == article_id else edge["source_id"]
                )
                other = articles.get(other_id)
                title = other["title"] if other else f"article {other_id}"
                lines.append(f"- {title} (strength {edge['strength']}): {edge['explanation']}")

            response = client.chat.completions.create(
                model=INSIGHT_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": PROMPT.format(
                            title=article["title"],
                            summary=(article.get("summary") or {}).get("executive_summary", ""),
                            neighbours="\n".join(lines) or "- none recorded",
                        ),
                    }
                ],
                response_format={"type": "json_object"},
                **reasoning_kwargs(),
            )
            insight = json.loads(response.choices[0].message.content)

            db.table("article_insights").upsert(
                {
                    "article_id": article_id,
                    "event_summary": insight.get("event_summary"),
                    "predictions": insight.get("predictions"),
                },
                on_conflict="article_id",
            ).execute()
            print(f"  [ok] {article['title']}")
        except Exception as exc:
            print(f"  [error] article {article_id}: {exc}")


if __name__ == "__main__":
    main()
