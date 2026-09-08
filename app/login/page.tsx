import SignInButton from "@/components/admin/SignInButton";

export const metadata = { title: "Sign in" };

/**
 * Signing in is not the same as being an admin. Anyone with a GitHub account
 * can complete this flow and get an `authenticated` session -- which, under the
 * current policies, grants exactly what a signed-out visitor already had. Admin
 * is a row in public.user_roles that only ever gets added by hand.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <section className="auth">
      <div className="auth-card">
        <p className="label">Restricted</p>
        <h1 className="auth-title">
          The <em>observatory</em> floor.
        </h1>
        <p className="auth-body">
          Curation, corrections and graph tuning. Sign in with GitHub to
          continue — access is granted per account, so an approved session is
          the only way past this point.
        </p>

        {error === "denied" ? (
          <p className="auth-error" role="alert">
            That account is signed in but not on the admin allowlist.
          </p>
        ) : null}
        {error === "exchange" ? (
          <p className="auth-error" role="alert">
            Sign-in could not be completed. The link may have expired — try
            again.
          </p>
        ) : null}

        <SignInButton next={next} />

        <p className="auth-foot mono-meta">
          Public pages need no account and never will.
        </p>
      </div>
    </section>
  );
}
