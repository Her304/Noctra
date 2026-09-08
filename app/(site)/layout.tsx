import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/**
 * The public shell: fixed nav, page, footer.
 *
 * This lives in a route group rather than the root layout because /admin and
 * /login must not inherit it. The nav is `position: fixed; z-index: 900`, so
 * anything else with its own header -- the admin bar, the sign-in card -- ended
 * up underneath it, with the two sets of controls overlapping in the same band.
 * The group changes no URLs: (site)/page.tsx is still "/".
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
