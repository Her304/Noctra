import ArticleCard from "@/components/ArticleCard";
import { APERCU_WINDOW_DAYS } from "@/lib/config";
import { getRecentArticles } from "@/lib/queries";
import type { Article } from "@/lib/types";

export const metadata = { title: "Apercu" };

// The pipeline runs hourly; no need to hit Supabase on every request.
export const revalidate = 300;

export default async function ApercuPage() {
  let articles: Article[] = [];
  let failed = false;

  // A paused or unreachable Supabase must not fail the whole build, or a
  // deploy during an outage would take the site down with it.
  try {
    articles = await getRecentArticles();
  } catch (error) {
    console.error(error);
    failed = true;
  }

  return (
    <>
      <header className="page-head">
        <div className="hero-stars" aria-hidden="true" />
        <div className="page-head-inner">
          <p className="label">Apercu — the briefing</p>
          <h1>
            The week, <em>read</em> through strategy.
          </h1>
          <p>
            Every story of the past {APERCU_WINDOW_DAYS} days, dissected through SWOT, PEST and
            Diamond-E. The deck is the argument; open the analysis for the working.
          </p>

          <div className="page-head-meta">
            <span className="mono-meta">Source · CNBC</span>
            <span className="mono-meta">Window · {APERCU_WINDOW_DAYS} days</span>
            <span className="mono-meta">
              {failed ? "Status · unreachable" : `Stories · ${articles.length}`}
            </span>
          </div>
        </div>
      </header>

      <div className="reading-room">
        <div className="reading-room-inner">
          {failed ? (
            <div className="empty-state">
              <h2>The archive is out of reach</h2>
              <p>
                The news database could not be reached just now. Nothing is lost — try again in a
                moment.
              </p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <h2>Nothing analysed yet</h2>
              <p>
                No analysed articles in the past {APERCU_WINDOW_DAYS} days. The pipeline runs
                hourly — check back shortly.
              </p>
            </div>
          ) : (
            articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
