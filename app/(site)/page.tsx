import Link from "next/link";
import { APERCU_WINDOW_DAYS, FREE_TIER_NODE_LIMIT } from "@/lib/config";

/* The sky is the product: every star is an event, every line a verified
   linkage. Drawn once, deterministically, so server and client agree.
   pathLength normalises each line to 1 so one dash pair can draw them all
   whatever their real length, and --i is the index the stagger reads. */
const STARS = [
  [180, 220], [380, 140], [560, 260], [740, 100], [920, 240], [1120, 160], [1320, 280], [1460, 180],
  [280, 440], [500, 380], [700, 460], [960, 400], [1200, 480], [1420, 420],
] as const;

const LINKS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [0, 8], [2, 9], [4, 11], [6, 12], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
];

function Constellation({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {LINKS.map(([a, b], i) => (
        <line
          key={i}
          x1={STARS[a][0]}
          y1={STARS[a][1]}
          x2={STARS[b][0]}
          y2={STARS[b][1]}
          pathLength={1}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.2} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </svg>
  );
}

/* ---- The hero field, taken from the Keynote mockup ----
   Five article cards scatter into the field, then four verified linkages draw
   themselves between them. Geometry is the mockup's own, on its 1920x1080
   stage, in its own build order. */
const CARDS = [
  { x: 840.3, y: 449.1, w: 239.3, h: 181.7, r: 27.26 },
  { x: 1273, y: 110.9, w: 423.2, h: 298.9, r: 44.84 },
  { x: 210.3, y: 712.3, w: 389.7, h: 241.7, r: 36.25 },
  { x: 318.3, y: 145.6, w: 173.8, h: 128.1, r: 19.8 },
  { x: 1310, y: 775.3, w: 239.3, h: 181.7, r: 27.26 },
] as const;

type Card = { x: number; y: number; w: number; h: number };

/* Every one of the mockup's four segments lies on the axis between the centre
   card and one of the other four — a hub and its consequences, which is the
   graph Catographic actually draws. The mockup leaves them as loose strokes
   near those axes; here they are completed, trimmed to each card's border
   with a small gap, so a linkage visibly joins two events. */
function linkage(a: Card, b: Card): readonly [number, number, number, number] {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  /* How far the border sits from the centre along this ray, whichever of the
     two sides the ray leaves through first. */
  const reach = (c: Card) =>
    Math.min(
      ux === 0 ? Infinity : Math.abs(c.w / 2 / ux),
      uy === 0 ? Infinity : Math.abs(c.h / 2 / uy),
    ) + 24;
  const ta = reach(a);
  const tb = reach(b);
  return [ax + ux * ta, ay + uy * ta, bx - ux * tb, by - uy * tb];
}

/* Drawn in the mockup's own build order. */
const LINKAGES = [4, 3, 2, 1].map((i) => linkage(CARDS[0], CARDS[i]));

function HeroField() {
  return (
    <svg
      className="hero-field"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {CARDS.map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          width={c.w}
          height={c.h}
          rx={c.r}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {LINKAGES.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          pathLength={1}
          style={{ "--i": i } as React.CSSProperties}
        />
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
      {/* ---------------- HERO ----------------
          The Keynote deck advances on a click; here the click is the scroll.
          .hero is a tall track and .hero-stage is pinned inside it, so the
          reader spends the track's height standing still in front of the
          mockup while their scroll scrubs it, beat for beat, forwards on the
          way down and backwards on the way up. When the track runs out the
          pin releases and the stage lifts and dims away under the seam. */}
      <section className="hero">
        <div className="hero-stage">
          <div className="hero-stars" aria-hidden="true" />
          <HeroField />

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

          {/* The mockup's first beat: the question the headline answers, and
              like the mockup it sits at the dead centre of the slide — a
              child of the stage rather than of .hero-body, whose own box is
              bottom-anchored and drifts off centre as the viewport grows.
              Absolutely positioned and last in the DOM so it neither shifts
              the layout nor disturbs the nth-child timings in .hero-body, and
              aria-hidden so the h1 keeps its own accessible name.

              Two elements, because the question is the one beat that has to
              answer to both clocks: the span rises on load, so the first
              paint is a built slide rather than an empty field, and the <p>
              carries it away on the scroll. One element cannot do both —
              the scroll animation fills from 0% and would overrule the load
              animation's own opacity before it had run. */}
          <p className="hero-ask" aria-hidden="true">
            <span>Every independent news source?</span>
          </p>
        </div>
      </section>

      {/* ---------------- SEAM ----------------
          The marquee is driven by the scroll rather than the clock: it runs
          while the reader moves and settles when they stop. */}
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
          <div className="statement reveal">
            <p className="label on-bone">Why Noctra</p>
            <p className="statement-body">
              Staying informed is the easy half.{" "}
              <span className="dim-ink">
                The hard half is knowing what a headline <em>does</em> — to a market, to a
                position, to the next quarter. Noctra does that half before you arrive.
              </span>
            </p>
          </div>

          <div className="bento reveal-group">
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

      {/* ---------------- THE LENS ----------------
          Four rows, and each rules itself off as it arrives — the mockup's
          line draw, at the scale of a list. */}
      <section className="day" style={{ paddingTop: 0 }}>
        <div className="day-inner" style={{ paddingTop: 0 }}>
          <div className="statement reveal">
            <p className="label on-bone">The lens</p>
            <h2 className="section-head">
              Four passes over <em>the same</em> paragraph.
            </h2>
          </div>

          <div className="lens reveal-group">
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

      {/* ---------------- THE MAP ----------------
          The visual is the mockup's other half: the constellation draws itself
          as the section arrives, exactly as the hero's linkages do. */}
      <section className="split">
        <div className="split-copy reveal-group">
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

        {/* The sky clips itself rather than the column: .hero-stars is inset
            past its own edges and has to be cut, but the brief below is meant
            to cross the seam onto the cream, and a clip on the column would
            take its left third with it. */}
        <div className="split-visual">
          <div className="split-sky" aria-hidden="true">
            <div className="hero-stars" />
            <Constellation className="constellation" />
          </div>

          <div className="split-card reveal">
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

      {/* ---------------- ESSAY ----------------
          The head is sticky, so it already answers to the scroll on its own;
          the body arrives beside it a paragraph at a time. */}
      <section className="essay">
        <div className="essay-grid">
          <div className="essay-head">
            <p className="label on-bone">The long version</p>
            <h2 className="section-head" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}>
              What is Noctra?
            </h2>
          </div>

          <div className="essay-body reveal-group">
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
        <div className="band-inner reveal-group">
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
