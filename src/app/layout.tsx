import type { Metadata, Viewport } from "next";
import "./globals.css";
import DarkModeToggle from "@/components/dark-mode-toggle";

export const metadata: Metadata = {
  title: "Vérité — Chat Wrapped & Red Flag Detector",
  description:
    "Analyse tes conversations WhatsApp. Découvre la vérité derrière chaque message. Red flags, scores, insights.",
  keywords: [
    "analyse WhatsApp",
    "red flags relation",
    "crush m'aime",
    "analyseur conversation",
    "score compatibilité",
    "détecter manipulation",
    "ghosting",
    "toxicité couple",
    "chat wrapped",
    "vérité relation",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
  alternates: {
    canonical: "https://ve-rite.app",
  },
  openGraph: {
    title: "Vérité — Ton crush t'aime vraiment ?",
    description: "Analyse tes conversations WhatsApp pour détecter les red flags, calculer les scores et découvrir la vérité.",
    url: "https://ve-rite.app",
    siteName: "Vérité",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Vérité — Analyse WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vérité — Analyse WhatsApp",
    description: "Red flags, score d'intérêt, compatibilité… Découvre la vérité sur ta relation.",
    images: ["/og-image.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vérité",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL("https://ve-rite.app"),
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Vérité",
              url: "https://ve-rite.app",
              description: "Analyse tes conversations WhatsApp pour détecter les red flags et découvrir la vérité sur ta relation.",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "All",
              offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
              author: { "@type": "Person", name: "Haniel_dev" },
              inLanguage: "fr",
            }),
          }}
        />
      </head>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        {children}
        <DarkModeToggle />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try{if(localStorage.getItem("verite-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js").then(r => console.log("SW registered", r.scope));
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
