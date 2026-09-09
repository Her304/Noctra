import type { Metadata } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/* Archivo carries the interface and the headline mass; Instrument Serif is the
   italic voice inside those headlines; JetBrains Mono handles every label,
   figure and piece of metadata. All three are self-hosted by next/font, so the
   old render-blocking Google Sans Flex and Font Awesome <link>s are gone --
   icons are now inline SVG. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Noctra — Where headlines become consequences",
    template: "%s — Noctra",
  },
  description:
    "Noctra reads the day's business news, dissects each story through PESTEL, SWOT, Porter and Diamond-E, then maps how one event drives the next.",
  /* The mark is hand-drawn artwork, so it ships as raster at fixed sizes
     rather than SVG. The .ico carries 16/32/48 for the tab and the legacy
     Windows path; the PNGs cover high-DPI tabs and the iOS home screen. */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* The font variables must live on <html>, not <body>: --font-sans is
       composed on :root, and a var() there can only see custom properties
       declared at that same element. */
    /* Document shell only. The public nav and footer belong to the (site)
       route group -- /admin and /login bring their own chrome and must not
       inherit a fixed-position nav that would sit on top of it. */
    <html lang="en" className={`${archivo.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
