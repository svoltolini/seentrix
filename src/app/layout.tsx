import type { Metadata } from "next";
import { Hanken_Grotesk, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_TITLE,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

// Clay design language: Hanken Grotesk for UI sans, Source Serif 4 for
// display/editorial headings, IBM Plex Mono for codes, CVE ids, dates and
// deadline countdowns (see design_handoff_seentrix_app/README.md).
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Root-level metadata — acts as the default for every page that doesn't
// set its own. `metadataBase` is required for OG/Twitter image URLs to
// resolve to absolute URLs in production; Next.js emits a warning at
// build time without it.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    // 'Seentrix — <page>' (brand first) reads like a clean file path in
    // the browser tab and matches how most B2B SaaS tabs are titled.
    // Each page sets its own simple label (e.g. 'Dashboard') and the
    // template prepends the brand automatically.
    template: `${SITE_NAME} — %s`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Cyber Resilience Act",
    "CRA compliance",
    "EU cybersecurity",
    "SBOM",
    "vulnerability management",
    "Declaration of Conformity",
    "manufacturer compliance",
    "CE marking",
    "product security",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    alternateLocale: ["de_DE"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@seentrix",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${hanken.variable} ${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
