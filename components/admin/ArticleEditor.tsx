"use client";

import { useActionState, useState } from "react";
import { updateEventSummary, updateExecutiveSummary } from "@/lib/admin/actions";

export default function ArticleEditor({
  id,
  title,
  domain,
  publishedAt,
  executiveSummary,
  eventSummary,
}: {
  id: number;
  title: string;
  domain: string | null;
  publishedAt: string | null;
  executiveSummary: string;
  eventSummary: string;
}) {
  // Collapsed by default: the queue is long, and most rows need no attention.
  const [open, setOpen] = useState(false);

  const [summaryState, submitSummary, summaryPending] = useActionState(
    updateExecutiveSummary,
    null
  );
  const [eventState, submitEvent, eventPending] = useActionState(
    updateEventSummary,
    null
  );

  const published = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-CA")
    : "undated";

  return (
    <li className={`admin-article${executiveSummary ? "" : " admin-article-gap"}`}>
      <button
        type="button"
        className="admin-article-head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="admin-article-title">{title}</span>
        <span className="mono-meta admin-article-meta">
          {domain ?? "—"} · {published}
          {executiveSummary ? "" : " · no summary"}
        </span>
      </button>

      {open ? (
        <div className="admin-article-body">
          <form action={submitSummary} className="admin-field">
            <input type="hidden" name="id" value={id} />
            <label className="mono-meta" htmlFor={`exec-${id}`}>
              Executive summary
            </label>
            <textarea
              id={`exec-${id}`}
              name="executive_summary"
              rows={5}
              defaultValue={executiveSummary}
              className="admin-input admin-textarea"
              placeholder="Not yet analysed."
            />
            <div className="admin-field-foot">
              <button type="submit" className="btn btn-ghost" disabled={summaryPending}>
                {summaryPending ? "Saving…" : "Save summary"}
              </button>
              {summaryState?.ok ? (
                <span className="mono-meta admin-ok">Saved</span>
              ) : null}
              {summaryState && !summaryState.ok ? (
                <span className="admin-error" role="alert">
                  {summaryState.error}
                </span>
              ) : null}
            </div>
          </form>

          <form action={submitEvent} className="admin-field">
            <input type="hidden" name="article_id" value={id} />
            <label className="mono-meta" htmlFor={`event-${id}`}>
              Event summary — the line that labels this node on the graph
            </label>
            <textarea
              id={`event-${id}`}
              name="event_summary"
              rows={3}
              defaultValue={eventSummary}
              className="admin-input admin-textarea"
              placeholder="No insight generated yet."
            />
            <div className="admin-field-foot">
              <button type="submit" className="btn btn-ghost" disabled={eventPending}>
                {eventPending ? "Saving…" : "Save event summary"}
              </button>
              {eventState?.ok ? <span className="mono-meta admin-ok">Saved</span> : null}
              {eventState && !eventState.ok ? (
                <span className="admin-error" role="alert">
                  {eventState.error}
                </span>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </li>
  );
}
