"""Extract article content and generate the strategic business analysis.

Selects only rows where summary is null. The Django version selected rows
missing content *or* summary, which let a row with a summary reach a branch
that never assigned its return value -- an UnboundLocalError swallowed by a
bare except, which is why only 13 of 45 rows ever got analysed.
"""

import argparse
import json

import trafilatura

from common import ANALYSIS_MODEL, openai, supabase

MAX_CONTENT_CHARS = 12_000

# The key names are pinned because the Catographic node card and the Apercu
# page both read them directly. An unconstrained prompt drifts between runs.
PROMPT = """Analyse the following news article as a senior business analyst.

ARTICLE TITLE: {title}
ARTICLE CONTENT: {content}

Respond with JSON in exactly this shape, with no extra keys:
{{
  "executive_summary": "two sentences on why this news matters",
  "swot_analysis": {{
    "strengths": [], "weaknesses": [], "opportunities": [], "threats": []
  }},
  "pest_analysis": {{
    "political": [], "economic": [], "social": [], "technological": []
  }},
  "diamond_e_analysis": {{
    "strategy": [], "resources": [], "management_preferences": [],
    "organization": [], "environment": []
  }}
}}
Every array holds short strings. Leave an array empty rather than inventing content."""


def analyse(client, title, content):
    response = client.chat.completions.create(
        model=ANALYSIS_MODEL,
        messages=[
            {"role": "system", "content": "You are a senior business analyst."},
            {"role": "user", "content": PROMPT.format(title=title, content=content)},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20, help="articles per run")
    args = parser.parse_args()

    db, client = supabase(), openai()
    pending = (
        db.table("articles")
        .select("id,title,url,content")
        .is_("summary", "null")
        .order("published_at", desc=True)
        .limit(args.limit)
        .execute()
        .data
    )

    if not pending:
        print("nothing to analyse")
        return

    print(f"analysing {len(pending)} articles")
    analysed = 0
    for row in pending:
        try:
            content = row.get("content")
            if not content and row.get("url"):
                downloaded = trafilatura.fetch_url(row["url"])
                content = trafilatura.extract(downloaded) if downloaded else None

            if not content:
                print(f"  [skip] no content: {row['title']}")
                continue

            summary = analyse(client, row["title"], content[:MAX_CONTENT_CHARS])
            db.table("articles").update(
                {"content": content, "summary": summary}
            ).eq("id", row["id"]).execute()
            analysed += 1
            print(f"  [ok] {row['title']}")
        except Exception as exc:
            print(f"  [error] {row['title']}: {exc}")

    print(f"analysed {analysed}/{len(pending)}")


if __name__ == "__main__":
    main()
