import Link from "next/link";
import { APERCU_WINDOW_DAYS, FREE_TIER_NODE_LIMIT } from "@/lib/config";

/* The sky is the product: every star is an event, every line a verified
   linkage. Drawn once, deterministically, so server and client agree. */
const STARS = [
  [18, 22], [38, 14], [56, 26], [74, 10], [92, 24], [112, 16], [132, 28], [146, 18],
  [28, 44], [50, 38], [70, 46], [96, 40], [120, 48], [142, 42],
] as const;

const LINKS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [0, 8], [2, 9], [4, 11], [6, 12], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
];

function Constellation({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {LINKS.map(([a, b], i) => (
        <line key={i} x1={STARS[a][0]} y1={STARS[a][1]} x2={STARS[b][0]} y2={STARS[b][1]} />
      ))}
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} />
      ))}
    </svg>
  );
}

const FRAMEWORKS = [
  {
    name: "SWOT",
    em: "the position",
    copy: "Strengths, weaknesses, opportunities and threats pulled from the story itself — not from a template, and never four bullets of restated headline.",
  },
  {
    name: "PEST",
    em: "the weather",
    copy: "Political, economic, social and technological forces acting on the event, so a tariff line reads as a macro condition rather than a news item.",
  },
  {
    name: "Diamond-E",
    em: "the fit",
    copy: "Environment, resources, management preferences and organisation, aligned against strategy — the test of whether a move is actually survivable.",
  },
  {
    name: "Linkage",
    em: "the consequence",
    copy: "A reasoning model reads two full articles and argues whether one drives the other. Rejections are kept, so the same pair is never re-litigated.",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <div className="hero-stars" aria-hidden="true" />
        <Constellation className="hero-constellation" />

        <div className="hero-body">
          <span className="hero-eyebrow">
            <span className="dot" aria-hidden="true" />
            Hourly from CNBC · Analysed by AI
          </span>

          <h1 className="display hero-title">
            <em>Where</em> headlines <span className="dim">become consequences.</span>
          </h1>

          <p className="hero-sub">
            Noctra reads the day&apos;s business news, dissects each story through the frameworks
            you were taught to use, then maps how one event drives the next — so the page you
            open is already an argument, not a feed.
          </p>

          <div className="hero-actions">
            <Link href="/apercu" className="btn btn-ember">
              Begin the briefing
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/catographic" className="btn btn-ghost">
              See the event map
            </Link>
          </div>
        </div>

        <dl className="hero-figures">
          <div className="hero-figure">
            <dt>Window</dt>
            <dd>
              {APERCU_WINDOW_DAYS} <span>days</span>
            </dd>
          </div>
          <div className="hero-figure">
            <dt>Events mapped</dt>
            <dd>
              {FREE_TIER_NODE_LIMIT} <span>nodes</span>
            </dd>
          </div>
          <div className="hero-figure">
            <dt>Lenses per story</dt>
            <dd>
              4 <span>frameworks</span>
            </dd>
          </div>
          <div className="hero-figure">
            <dt>Refresh</dt>
            <dd>
              60 <span>minutes</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* ---------------- SEAM ---------------- */}
      <div className="seam" aria-hidden="true">
        <div className="seam-track">
          <span>
            SWOT <b>✳</b> PEST <b>✳</b> Diamond-E <b>✳</b> Causal linkage <b>✳</b> Second-order
            effects <b>✳</b> Verified rejections <b>✳</b> Executive summary <b>✳</b>
          </span>
          <span>
            SWOT <b>✳</b> PEST <b>✳</b> Diamond-E <b>✳</b> Causal linkage <b>✳</b> Second-order
            effects <b>✳</b> Verified rejections <b>✳</b> Executive summary <b>✳</b>
          </span>
        </div>
      </div>

      {/* ---------------- WHY ---------------- */}
      <section className="day">
        <div className="day-inner">
          <div className="statement">
            <p className="label on-bone">Why Noctra</p>
            <p className="statement-body">
              Staying informed is the easy half.{" "}
              <span className="dim-ink">
                The hard half is knowing what a headline <em>does</em> — to a market, to a
                position, to the next quarter. Noctra does that half before you arrive.
              </span>
            </p>
          </div>

          <div className="bento">
            <article className="tile tile-quiet">
              <div className="tile-glyph">
                <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
                  <rect x="7" y="11" width="32" height="24" rx="3" stroke="#E9B44C" strokeWidth="1.1" />
                  <path d="M12 18h13M12 23h18M12 28h9" stroke="#8B99BC" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3>The source is one</h3>
                <p>
                  Ten business stories a day, taken straight from CNBC and nowhere else. Quality
                  of source over volume of feed.
                </p>
              </div>
            </article>

            <article className="tile tile-feature">
              <span className="tile-badge" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.1" />
                  <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.1" />
                  <path d="M5.6 5.6 10.4 10.4" stroke="currentColor" strokeWidth="1.1" />
                </svg>
              </span>
              <h3>
                Every story is <em>argued</em>, not summarised
              </h3>
              <p>
                A reasoning model reads the full article — not the abstract — and takes a position
                on what it means and what it touches. Weak claims are thrown out and recorded as
                thrown out, so the engine never pays twice for the same dead end.
              </p>
            </article>

            <article className="tile tile-quiet">
              <div className="tile-glyph">
                <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
                  <circle cx="14" cy="16" r="3.2" stroke="#E9B44C" strokeWidth="1.1" />
                  <circle cx="32" cy="14" r="2.4" stroke="#8B99BC" strokeWidth="1.1" />
                  <circle cx="26" cy="31" r="4" stroke="#E9B44C" strokeWidth="1.1" />
                  <path d="M17 17.4 23 29M17 15.2 29.6 14.4M30 16.2 27.4 27" stroke="#8B99BC" strokeWidth="0.9" />
                </svg>
              </div>
              <div>
                <h3>Nothing sits alone</h3>
                <p>
                  Oil, tyres, hiring, rates. The map draws the line only when the reasoning holds
                  up to scrutiny.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ---------------- THE LENS ---------------- */}
      <section className="day" style={{ paddingTop: 0 }}>
        <div className="day-inner" style={{ paddingTop: 0 }}>
          <div className="statement">
            <p className="label on-bone">The lens</p>
            <h2 className="section-head">
              Four passes over <em>the same</em> paragraph.
            </h2>
          </div>

          <div className="lens">
            {FRAMEWORKS.map((item, index) => (
              <article className="lens-row" key={item.name}>
                <span className="lens-index">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="lens-name">
                  {item.name} <em>— {item.em}</em>
                </h3>
                <p className="lens-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- THE MAP ---------------- */}
      <section className="split">
        <div className="split-copy">
          <p className="label on-bone">The map</p>
          <h2 className="section-head">
            One event is a dot. <em>Two</em> is an argument.
          </h2>
          <p>
            Catographic lays the week&apos;s {FREE_TIER_NODE_LIMIT} most connected events out as a
            force-directed field. Hover a node and its neighbourhood stays lit while everything
            else recedes; click a line to read why the model believes one event drives the other.
          </p>
          <p>
            Similarity is deliberately not the filter. Same-topic stories score high and teach you
            nothing — the links worth having cross sectors, which is exactly where cosine distance
            goes quiet.
          </p>
          <Link href="/catographic" className="btn btn-ink">
            Open Catographic
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="split-visual">
          <div className="hero-stars" aria-hidden="true" />
          <Constellation className="constellation" />

          <div className="split-card">
            <div className="split-card-swatch" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4 18c4-1 6-9 9-9s5 6 9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="4" cy="18" r="1.8" fill="currentColor" />
                <circle cx="22" cy="13" r="1.8" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h4>Crude climbs → tyre input costs</h4>
              <p>
                A second-order link the verifier kept: synthetic rubber tracks the oil complex, so
                the cost floor moves before the tyre headline does.
              </p>
              <span className="strength">Strength 0.52 · verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ESSAY ---------------- */}
      <section className="essay">
        <div className="essay-grid">
          <div className="essay-head">
            <p className="label on-bone">The long version</p>
            <h2 className="section-head" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}>
              What is Noctra?
            </h2>
          </div>

          <div className="essay-body">
            <p>
              Staying informed is only half the battle. The real challenge is making sense of the
              news through the frameworks you are actually studying — PESTEL, SWOT, Porter&apos;s
              Five Forces, VRIO, Diamond-E. Those tools tend to feel sealed off from the headlines
              you read every morning, and the work of connecting the two falls to you, at the worst
              possible hour, the night before it is due.
            </p>

            <p>
              Noctra closes that gap. The day&apos;s most important business reporting arrives from
              CNBC and a professor&apos;s lens is applied to it immediately: each story broken down
              through the exact models you need for assignments, case studies, exams, and the
              meetings that come after them.
            </p>

            <blockquote className="pull">
              Open the site and the latest merger, tariff, supply-chain break or tech regulation is
              already dissected — and already connected to what it moves.
            </blockquote>

            <p>
              Because every insight is grounded in credible reporting rather than an aggregator,
              you can follow any claim back to the article that produced it. Whether you are an
              undergraduate facing a first PESTEL, an MBA candidate in a case competition, or a
              professional sharpening a strategic read, Noctra moves you past passive reading and
              into position.
            </p>

            <p>
              The analysis and the linkages are generated by AI and can be wrong. Every card keeps
              its source one click away for exactly that reason.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- BAND ---------------- */}
      <section className="band">
        <div className="hero-stars" aria-hidden="true" />
        <div className="band-inner">
          <p className="label" style={{ justifyContent: "center" }}>
            Tonight&apos;s reading
          </p>
          <h2 className="display" style={{ fontSize: "clamp(2.2rem, 5.4vw, 4.2rem)", marginTop: "1rem" }}>
            The day is already <em className="dim">analysed.</em>
          </h2>
          <div className="band-actions">
            <Link href="/apercu" className="btn btn-ember">
              Begin the briefing
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/catographic" className="btn btn-ghost">
              See the event map
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
