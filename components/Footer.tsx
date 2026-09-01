import Link from "next/link";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-grid">
        <div>
          <h2 className="wordmark" style={{ fontSize: "1.6rem" }}>
            Noctra
          </h2>
          <p className="foot-tagline">
            The day&apos;s business news, read through strategy — and mapped by consequence.
          </p>

          <div className="foot-socials">
            <a href="https://github.com/Her304" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/chin-wong-24681b392"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M3.6 2A1.6 1.6 0 1 0 3.6 5.2 1.6 1.6 0 0 0 3.6 2ZM2.2 6.4h2.8V14H2.2V6.4Zm4.6 0h2.7v1.04h.04c.38-.68 1.3-1.4 2.68-1.4 2.86 0 3.39 1.76 3.39 4.05V14h-2.83v-3.46c0-.83-.02-1.9-1.2-1.9-1.2 0-1.39.9-1.39 1.84V14H6.8V6.4Z" />
              </svg>
            </a>
            <a
              href="https://buymeacoffee.com/hercules21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy me a coffee"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M2 6h9v4a3.5 3.5 0 0 1-3.5 3.5h-2A3.5 3.5 0 0 1 2 10V6Zm10 0h1.25a2.25 2.25 0 0 1 0 4.5H12V6Zm0 1.2v2.1h1.25a1.05 1.05 0 0 0 0-2.1H12ZM3.4 2.2c.5.5.5 1.1 0 1.6l-.3.3.85.85.3-.3c.95-.95.95-2.35 0-3.3L3.4 2.2Zm3 0c.5.5.5 1.1 0 1.6l-.3.3.85.85.3-.3c.95-.95.95-2.35 0-3.3L6.4 2.2Zm3 0c.5.5.5 1.1 0 1.6l-.3.3.85.85.3-.3c.95-.95.95-2.35 0-3.3L9.4 2.2Z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4>Surfaces</h4>
          <ul>
            <li><Link href="/">Index</Link></li>
            <li><Link href="/apercu">Apercu — the briefing</Link></li>
            <li><Link href="/catographic">Catographic — the map</Link></li>
          </ul>
        </div>

        <div>
          <h4>Elsewhere</h4>
          <ul>
            <li>
              <a href="https://www.cnbc.com" target="_blank" rel="noopener noreferrer">
                CNBC — the source
              </a>
            </li>
            <li>
              <a href="https://github.com/Her304" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://buymeacoffee.com/hercules21" target="_blank" rel="noopener noreferrer">
                Buy me a coffee
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* The wordmark at poster scale, outlined so it reads as texture. */}
      <div className="foot-mark" aria-hidden="true">
        <span>Noctra</span>
      </div>

      <div className="foot-legal">
        <p className="mono-meta" style={{ margin: 0 }}>
          © {new Date().getFullYear()} Noctra — built by Chin Wong
        </p>
        <p className="mono-meta" style={{ margin: 0 }}>
          Analysis is AI-generated · verify before you rely on it
        </p>
      </div>
    </footer>
  );
}
