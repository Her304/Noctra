import type { Metadata } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
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
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${instrument.variable} ${jetbrains.variable}`}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
