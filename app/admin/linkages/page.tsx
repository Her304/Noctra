import LinkageRow from "@/components/admin/LinkageRow";
import { getAdminLinkages } from "@/lib/admin/queries";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Linkages" };

export default async function AdminLinkagesPage() {
  const [linkages, settings] = await Promise.all([
    getAdminLinkages(settingsWindowFallback()),
    getSettings(),
  ]);

  const accepted = linkages.filter((l) => l.is_linked);
  const drawn = accepted.filter(
    (l) => (l.strength ?? 0) >= settings.minLinkStrength
  ).length;

  return (
    <section className="admin-section">
      <header className="admin-head">
        <h1>
          Linkage <em>curation</em>.
        </h1>
        <p className="admin-lede">
          Every edge the verifier examined, including the ones Catographic
          refuses to draw. Retiring an edge sets <code>is_linked</code> to false
          rather than deleting it — the verdict stays on the record, so the next
          run does not pay for the same answer again.
        </p>

        <div className="page-head-meta">
          <span className="mono-meta">Examined · {linkages.length}</span>
          <span className="mono-meta">Accepted · {accepted.length}</span>
          <span className="mono-meta">Drawn · {drawn}</span>
          <span className="mono-meta">
            Floor · {settings.minLinkStrength.toFixed(2)}
          </span>
        </div>
      </header>

      {linkages.length === 0 ? (
        <div className="empty-state">
          <h2>No linkages in the window</h2>
          <p>Nothing has been verified recently — check the health page.</p>
        </div>
      ) : (
        <ul className="linkage-list">
          {linkages.map((linkage) => (
            <LinkageRow
              key={linkage.id}
              linkage={linkage}
              floor={settings.minLinkStrength}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Curation deliberately looks wider than the graph window: an edge that just
 * aged out is exactly the one worth checking before it disappears from view.
 */
function settingsWindowFallback() {
  return 30;
}
