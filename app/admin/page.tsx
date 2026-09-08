import { getPipelineHealth } from "@/lib/admin/queries";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Health" };

function ago(iso: string | null) {
  if (!iso) return "never";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** The pipeline is hourly, so silence past ~90 minutes means a failed run. */
function staleness(iso: string | null) {
  if (!iso) return "bad";
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours > 6) return "bad";
  if (hours > 1.5) return "warn";
  return "ok";
}

function Stat({
  label,
  value,
  note,
  tone = "ok",
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: "ok" | "warn" | "bad";
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <p className="stat-label mono-meta">{label}</p>
      <p className="stat-value">{value}</p>
      {note ? <p className="stat-note">{note}</p> : null}
    </div>
  );
}

export default async function AdminHealthPage() {
  const [health, settings] = await Promise.all([getPipelineHealth(), getSettings()]);

  if (!health) {
    return (
      <section className="admin-section">
        <div className="empty-state">
          <h2>Health is unreadable</h2>
          <p>get_pipeline_health() did not answer. The database may be paused.</p>
        </div>
      </section>
    );
  }

  const { articles, linkages, insights, strengthHistogram } = health;
  const peak = Math.max(1, ...strengthHistogram.map((b) => b.count));

  // The floor only does work if some accepted edges fall below it. If every
  // edge clears it, it is decoration; if it lands on the modal bucket, it is a
  // coin-flip -- which is exactly how Catographic went blank once already.
  const belowFloor = linkages.linked - linkages.aboveFloor;

  return (
    <section className="admin-section">
      <header className="admin-head">
        <h1>
          Pipeline <em>health</em>.
        </h1>
        <p className="admin-lede">
          What the last run wrote, and what it left unfinished. The cron is
          hourly — anything quiet for six hours has failed rather than idled.
        </p>
      </header>

      <div className="stat-grid">
        <Stat
          label="Articles"
          value={articles.total}
          note={`${articles.last24h} added in 24h`}
        />
        <Stat
          label="Last write"
          value={ago(articles.lastWrite)}
          note="fetch_news.py"
          tone={staleness(articles.lastWrite)}
        />
        <Stat
          label="Awaiting summary"
          value={articles.awaitingSummary}
          note="analyse_news.py"
          tone={articles.awaitingSummary > 0 ? "warn" : "ok"}
        />
        <Stat
          label="Awaiting embedding"
          value={articles.awaitingEmbed}
          note="embed_articles.py"
          tone={articles.awaitingEmbed > 0 ? "warn" : "ok"}
        />
        <Stat
          label="Linkages drawn"
          value={linkages.aboveFloor}
          note={`of ${linkages.linked} accepted · floor ${settings.minLinkStrength.toFixed(2)}`}
          tone={linkages.aboveFloor === 0 && linkages.linked > 0 ? "bad" : "ok"}
        />
        <Stat
          label="Hidden by floor"
          value={belowFloor}
          note={belowFloor > linkages.aboveFloor ? "floor is hiding the majority" : "within reason"}
          tone={belowFloor > linkages.aboveFloor ? "warn" : "ok"}
        />
        <Stat
          label="Rejected pairs"
          value={linkages.rejected}
          note="verified, not linked — cached so the LLM is not re-paid"
        />
        <Stat
          label="Insights"
          value={insights.total}
          note={ago(insights.lastWrite)}
        />
      </div>

      <div className="admin-panel">
        <h2 className="admin-panel-title">Strength distribution</h2>
        <p className="admin-panel-note">
          Accepted edges by verifier strength. A single tall bucket means the
          model is anchoring rather than discriminating, and the floor below is
          a coin-flip sitting on top of the mode.
        </p>

        {strengthHistogram.length === 0 ? (
          <p className="admin-empty">No accepted linkages to plot.</p>
        ) : (
          <ul className="histogram">
            {strengthHistogram.map((bucket) => {
              const under = Number(bucket.floor) < settings.minLinkStrength;
              return (
                <li key={bucket.floor} className="histogram-row">
                  <span className="histogram-label mono-meta">{bucket.floor}</span>
                  <span className="histogram-track">
                    <span
                      className={`histogram-bar${under ? " histogram-bar-under" : ""}`}
                      style={{ width: `${(bucket.count / peak) * 100}%` }}
                    />
                  </span>
                  <span className="histogram-count mono-meta">
                    {bucket.count}
                    {under ? " · hidden" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
