"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Index" },
  { href: "/apercu", label: "Apercu" },
  { href: "/catographic", label: "Catographic" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // The rail is transparent over the hero and condenses into glass once the
  // page moves -- the nav should never compete with the first headline.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The overlay covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = (href: string) =>
    pathname === href ? ("page" as const) : undefined;

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <Link className="nav-brand" href="/" onClick={() => setOpen(false)}>
            Noctra<sup>®</sup>
          </Link>

          <ul className="nav-links">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link className="nav-link" href={link.href} aria-current={current(link.href)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/apercu" className="btn btn-ember nav-cta">
            Begin the briefing
            <span className="arrow" aria-hidden="true">→</span>
          </Link>

          <button
            type="button"
            className="nav-burger"
            aria-expanded={open}
            aria-controls="overlay-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`overlay${open ? " open" : ""}`} id="overlay-menu" aria-hidden={!open}>
        <ul className="overlay-menu">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                className="overlay-link"
                href={link.href}
                aria-current={current(link.href)}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              className="overlay-link"
              href="https://buymeacoffee.com/hercules21"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              Support
            </a>
          </li>
        </ul>

        <p className="overlay-foot mono-meta">Hourly from CNBC · Analysed by AI</p>
      </div>
    </>
  );
}
