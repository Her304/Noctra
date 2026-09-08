import SettingField from "@/components/admin/SettingField";
import { getSettingRows } from "@/lib/admin/queries";

export const metadata = { title: "Tuning" };

/** Mirrors the BOUNDS map the server action validates against. */
const INPUT: Record<string, { step: number; min: number; max: number }> = {
  min_link_strength: { step: 0.05, min: 0, max: 1 },
  graph_window_days: { step: 1, min: 1, max: 365 },
  apercu_window_days: { step: 1, min: 1, max: 365 },
  free_tier_node_limit: { step: 1, min: 1, max: 500 },
};

export default async function AdminSettingsPage() {
  const rows = await getSettingRows();

  return (
    <section className="admin-section">
      <header className="admin-head">
        <h1>
          Graph <em>tuning</em>.
        </h1>
        <p className="admin-lede">
          These four numbers have each blanked a public page at least once. They
          live in the database now, so correcting one takes a save rather than a
          deploy — the public pages pick it up on their next revalidation, at
          most five minutes later.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="empty-state">
          <h2>Settings unavailable</h2>
          <p>
            The settings table could not be read. The public pages fall back to
            the constants in <code>lib/config.ts</code> in the meantime.
          </p>
        </div>
      ) : (
        <div className="setting-list">
          {rows.map((row) => (
            <SettingField
              key={row.key}
              settingKey={row.key}
              value={row.value}
              description={row.description}
              updatedAt={row.updated_at}
              input={INPUT[row.key] ?? { step: 1, min: 0, max: 1000 }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
