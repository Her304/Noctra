"""Two-step linkage discovery.

Step 1 (cheap): pgvector cosine similarity proposes candidate pairs.
Step 2 (expensive): the LLM decides whether the pair is causally related and
which side is the trigger.

Rejected pairs are stored with verified=true, is_linked=false so the next run
does not re-pay for the same negative verdict.
"""

import argparse
import json
from datetime import datetime, timedelta, timezone
from itertools import islice

from common import LINKAGE_MODEL, openai, reasoning_kwargs, supabase

# The score is the only tunable the app has -- lib/config.ts gates the graph on
# MIN_LINK_STRENGTH -- so it has to spread. An earlier version named 0.35 as the
# first example value and got 7 of 9 accepted links back at exactly 0.35: the
# model anchored on the lowest acceptable number rather than scoring the case.
# Scoring off three observable properties of the channel, with no single salient
# example number, makes the score a function of the pair instead of a hedge.
VERIFY_PROMPT = """You are mapping causal relationships between business news events.

EVENT A: {title_a}
{summary_a}

EVENT B: {title_b}
{summary_b}

Decide whether one event plausibly drives, amplifies, or constrains the other.

COUNTS AS LINKED
- Direct effect: one event changes the other's costs, demand, supply, pricing,
  financing, or regulatory position.
- Second-order effect: one event moves a shared driver -- a commodity, interest
  rate, tariff, input cost, policy, or consumer behaviour -- which in turn moves
  the other. These are the most valuable links to find. A strike at a lithium
  mine is a second-order price shock for EV manufacturers, and that counts.

DOES NOT COUNT
- Same sector, industry, or asset class with no mechanism transmitting between them.
- Both events being consequences of the same upstream cause while having no effect
  on each other.
- Vague "both reflect the wider economy" reasoning.

Name the transmission channel explicitly: what moves, in which direction, reaching
whom. If you cannot state that channel in one sentence, it is not a link.

SCORING
Settle three properties of the channel before you score, and report each one:

  steps      1 -- the cause lands directly on the other party.
             2 -- it moves one shared driver, which then moves the other party.
             3 -- it needs a chain of drivers, any of which could absorb the shock.
  magnitude  "material"  -- large enough to show up in the affected party's costs,
                            revenue, volumes, or valuation.
             "marginal"  -- direction is right, but the size is trivial or swamped
                            by drivers that have nothing to do with this event.
  support    "stated"    -- one of the two articles names this mechanism itself.
             "inferred"  -- you are supplying the mechanism from background knowledge.

Then read the score off those three properties:

  0.85-1.00  1-2 steps, material, and an article names the mechanism.
  0.65-0.84  1-2 steps, material, inferred. A clean second-order channel through a
             shared driver belongs here.
  0.45-0.64  3 steps and material; or 1-2 steps where the effect is real but modest.
  0.30-0.44  The channel holds, but the effect is marginal for the affected party.
  0.15-0.29  A channel you can name but not defend: the shared driver has other,
             larger inputs that dominate whatever this event does to it.
  0.00-0.14  No channel at all. Sector adjacency, shared upstream cause, or
             "both reflect the wider economy".

Steps are not a penalty. Finding the shared driver is the point of this exercise:
oil prices rising, reaching a tyre maker through input costs, is a 2-step channel
and a strong link, not a weak one. Discount for steps only when each extra hop adds
somewhere the shock can be absorbed before it arrives. Magnitude is the real
discriminator -- ask how much of the affected party's costs or revenue this actually
moves. "inferred" is the normal case, since these articles were written
independently and rarely reference each other; it is not itself a mark against a link.

Set linked to true when strength reaches 0.30, false below it.

The score carries real information, so spend the range. Do not park on the edge of a
band: 0.35 and 0.40 are not defaults. If you find yourself reaching for one, the
question you have not yet answered is whether the effect is material or marginal for
the receiving party -- settle that and score what you settled. Two pairs whose causal
cases differ must not come back with the same number. Score rejected pairs on this
same table: a near-miss at 0.25 has to stay distinguishable from a non-starter at 0.05.

Respond with JSON in exactly this shape:
{{
  "steps": 1, 2 or 3,
  "magnitude": "material" or "marginal",
  "support": "stated" or "inferred",
  "linked": true or false,
  "cause": "A" or "B",
  "strength": 0.0 to 1.0,
  "directness": "direct" or "second-order",
  "explanation": "the transmission channel, in one sentence"
}}"""


def parse_embedding(value):
    """PostgREST serialises vector columns as a JSON-ish string."""
    if isinstance(value, str):
        return json.loads(value)
    return value


CONTEXT_CHARS = 900


def context(row):
    """Summary plus a slice of the article body.

    The executive summary alone loses the mechanism: Toyota's RAV4 summary never
    mentions fuel economy, so no verifier could connect it to an oil-price move.
    """
    summary = (row.get("summary") or {}).get("executive_summary") or ""
    body = (row.get("content") or "")[:CONTEXT_CHARS].strip()
    return f"{summary}\n\nFrom the article: {body}" if body else summary


def verify(client, a, b):
    response = client.chat.completions.create(
        model=LINKAGE_MODEL,
        messages=[
            {
                "role": "user",
                "content": VERIFY_PROMPT.format(
                    title_a=a["title"],
                    summary_a=context(a),
                    title_b=b["title"],
                    summary_b=context(b),
                ),
            }
        ],
        response_format={"type": "json_object"},
        **reasoning_kwargs(),
    )
    return json.loads(response.choices[0].message.content)


def cosine(u, v):
    dot = sum(a * b for a, b in zip(u, v))
    nu = sum(a * a for a in u) ** 0.5
    nv = sum(b * b for b in v) ** 0.5
    return dot / (nu * nv) if nu and nv else 0.0


def candidate_pairs(articles, args, already_seen):
    """Every unseen pair, most recent first.

    Cosine similarity is recorded but deliberately NOT used as a filter. Measured
    on real data, it is anti-correlated with causal insight: the oil-price ->
    tyre-input-cost link scored 0.20 while three unrelated same-sector pairs
    scored above 0.40. Similarity finds same-topic pairs, and causation worth
    surfacing usually crosses topics. --max-verify is the real cost control.
    """
    vectors = {r["id"]: parse_embedding(r["embedding"]) for r in articles}
    emitted = set()

    for i, row in enumerate(articles):
        for other in articles[i + 1:]:
            key = (min(row["id"], other["id"]), max(row["id"], other["id"]))
            if key in already_seen or key in emitted:
                continue
            sim = cosine(vectors[row["id"]], vectors[other["id"]])
            if sim < args.min_similarity:
                continue
            emitted.add(key)
            yield row, other, sim


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--min-similarity", type=float, default=0.0,
                        help="hard floor only; not the primary filter (see candidate_pairs)")
    parser.add_argument("--max-verify", type=int, default=100, help="hard cost ceiling per run")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="list the pairs that would be verified, without calling the model",
    )
    args = parser.parse_args()

    db, client = supabase(), openai()

    cutoff = (
        datetime.now(timezone.utc) - timedelta(days=args.days)
    ).isoformat()
    articles = (
        db.table("articles")
        .select("id,title,summary,content,embedding")
        .not_.is_("embedding", "null")
        .gte("published_at", cutoff)
        .order("published_at", desc=True)
        .limit(500)
        .execute()
        .data
    )
    if len(articles) < 2:
        print("need at least two embedded articles")
        return

    existing = db.table("linkages").select("source_id,target_id").execute().data
    already_seen = {
        (min(r["source_id"], r["target_id"]), max(r["source_id"], r["target_id"]))
        for r in existing
    }

    pairs = list(islice(candidate_pairs(articles, args, already_seen), args.max_verify))
    if not pairs:
        print(f"no new candidate pairs above similarity {args.min_similarity}")
        return

    if args.dry_run:
        print(f"{len(pairs)} pairs would be verified (of {len(articles)} articles in window):\n")
        for a, b, sim in pairs:
            print(f"  {a['id']:>3} <-> {b['id']:<3} sim={sim:.3f}  "
                  f"{a['title'][:38]} | {b['title'][:38]}")
        return

    print(f"verifying {len(pairs)} candidate pairs with {LINKAGE_MODEL}")
    linked = 0
    for a, b, similarity in pairs:
        try:
            verdict = verify(client, a, b)
            is_linked = bool(verdict.get("linked"))
            # source is the trigger, target the ripple effect.
            cause_is_a = str(verdict.get("cause", "A")).strip().upper() != "B"
            source, target = (a, b) if cause_is_a else (b, a)

            db.table("linkages").insert(
                {
                    "source_id": source["id"],
                    "target_id": target["id"],
                    "similarity": similarity,
                    "strength": float(verdict.get("strength") or 0.0),
                    "explanation": verdict.get("explanation"),
                    "verified": True,
                    "is_linked": is_linked,
                    "model_used": LINKAGE_MODEL,
                }
            ).execute()

            linked += is_linked
            mark = "link" if is_linked else "  no"
            print(f"  [{mark}] {a['title'][:45]} <-> {b['title'][:45]}")
        except Exception as exc:
            print(f"  [error] pair {a['id']}/{b['id']}: {exc}")

    print(f"linked {linked}/{len(pairs)} candidates")
    if pairs and linked == len(pairs):
        print("WARNING: every candidate was accepted -- the prompt is too permissive")


if __name__ == "__main__":
    main()
