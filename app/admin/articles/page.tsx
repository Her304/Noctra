import ArticleEditor from "@/components/admin/ArticleEditor";
import { getAdminArticles } from "@/lib/admin/queries";
import type { ArticleSummary } from "@/lib/types";

export const metadata = { title: "Articles" };

type InsightShape = { event_summary: string | null } | { event_summary: string | null }[] | null;

/**
 * PostgREST returns an embedded one-to-one as an object but a one-to-many as an
 * array, and article_insights is a PK-on-FK table that can be read either way
 * depending on how the relationship is detected. Normalising here keeps that
 * ambiguity out of the component.
 */
function firstInsight(value: InsightShape) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminArticlesPage() {
  const articles = await getAdminArticles();
  const unanalysed = articles.filter((a) => !a.summary).length;

  return (
    <section className="admin-section">
      <header className="admin-head">
        <h1>
          Article <em>corrections</em>.
        </h1>
        <p className="admin-lede">
          The model's read of each story, editable where it got things wrong.
          Editing the executive summary merges into the existing analysis — the
          SWOT, PEST and Diamond-E sections are left untouched.
        </p>

        <div className="page-head-meta">
          <span className="mono-meta">Showing · {articles.length}</span>
          <span className="mono-meta">Unanalysed · {unanalysed}</span>
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="empty-state">
          <h2>No articles</h2>
          <p>Nothing has been fetched yet — check the health page.</p>
        </div>
      ) : (
        <ul className="admin-article-list">
          {articles.map((article) => {
            const summary = article.summary as ArticleSummary | null;
            const insight = firstInsight(article.article_insights as InsightShape);

            return (
              <ArticleEditor
                key={article.id}
                id={article.id}
                title={article.title}
                domain={article.domain}
                publishedAt={article.published_at}
                executiveSummary={summary?.executive_summary ?? ""}
                eventSummary={insight?.event_summary ?? ""}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
