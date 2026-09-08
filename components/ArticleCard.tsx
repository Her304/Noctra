import type { AnalysisSection, Article } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* The model returns its categories in whatever order the JSON happened to
   serialise, which put Threats before Strengths. Each framework has a reading
   order, and the quadrant accent colours key off position -- so sort first. */
const CANONICAL: Record<string, string[]> = {
  swot: ["strengths", "weaknesses", "opportunities", "threats"],
  pest: ["political", "economic", "social", "technological", "environmental", "legal"],
  diamond: ["environment", "resources", "management_preferences", "organisation", "strategy"],
};

function rank(order: string[], key: string) {
  const index = order.indexOf(key.toLowerCase().replace(/[\s-]/g, "_"));
  return index === -1 ? order.length : index;
}

/* Each framework renders as a quadrant field rather than a stack of headings:
   SWOT is four boxes because it *is* four boxes, and PEST and Diamond-E read
   the same way once their categories are given equal weight. */
function Framework({
  title,
  order,
  data,
}: {
  title: string;
  order: string[];
  data?: AnalysisSection;
}) {
  if (!data || typeof data !== "object") return null;

  const entries = Object.entries(data)
    .filter(([, items]) => Array.isArray(items) && items.length > 0)
    .sort(([a], [b]) => rank(order, a) - rank(order, b) || a.localeCompare(b));
  if (entries.length === 0) return null;

  return (
    <section className="framework">
      <h4>{title}</h4>
      <div className="quadrants">
        {entries.map(([category, items]) => (
          <article className="quadrant" key={category}>
            <h5>{category.replace(/_/g, " ")}</h5>
            <ul>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ArticleCard({ article, index }: { article: Article; index: number }) {
  const summary = article.summary;
  const date = formatDate(article.published_at);
  const hasFrameworks = Boolean(
    summary?.swot_analysis || summary?.pest_analysis || summary?.diamond_e_analysis
  );

  return (
    <article className="entry">
      <div className="entry-rail">
        <span className="entry-index">{String(index + 1).padStart(2, "0")}</span>
        {date && <span className="mono-meta">{date}</span>}
        {article.domain && <span className="mono-meta domain">{article.domain}</span>}
      </div>

      <div>
        <h2 className="entry-title">{article.title}</h2>

        {summary?.executive_summary && <p className="entry-deck">{summary.executive_summary}</p>}

        {/* Folded by default: ten stories of full SWOT/PEST/Diamond-E at once
            is a wall, and the deck above is what most visits actually want. */}
        {hasFrameworks && (
          <details className="frameworks">
            <summary>
              Open the analysis
              <svg className="chev" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="m1.5 3.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </summary>

            <Framework title="SWOT — the position" order={CANONICAL.swot} data={summary?.swot_analysis} />
            <Framework title="PEST — the weather" order={CANONICAL.pest} data={summary?.pest_analysis} />
            <Framework
              title="Diamond-E — the fit"
              order={CANONICAL.diamond}
              data={summary?.diamond_e_analysis}
            />
          </details>
        )}

        <div className="entry-actions">
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="link-out">
              Read the source
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                <path d="M2 7 7 2M3.4 2H7v3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
