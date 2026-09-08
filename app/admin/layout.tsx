import Link from "next/link";
import { requireAdmin } from "@/lib/admin/queries";

export const metadata = {
  title: "Admin",
  // The observatory floor is not for indexing.
  robots: { index: false, follow: false },
};

/**
 * Admin state changes on write, so nothing under here may be prerendered or
 * cached. Without this the dashboard would happily serve a five-minute-old
 * count back to the person who just changed it.
 */
export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Health" },
  { href: "/admin/linkages", label: "Linkages" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/settings", label: "Tuning" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The real gate. Redirects before any child renders; the proxy redirect is
  // only there to make the common case pretty.
  const { user } = await requireAdmin();

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <div className="admin-identity">
            <p className="label">Observatory</p>
            <p className="mono-meta admin-who">
              {user.email ?? user.user_metadata?.user_name ?? "admin"}
            </p>
          </div>

          <nav className="admin-tabs">
            {TABS.map((tab) => (
              <Link key={tab.href} href={tab.href} className="admin-tab">
                {tab.label}
              </Link>
            ))}
          </nav>

          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost admin-signout">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="admin-body">{children}</div>
    </div>
  );
}
