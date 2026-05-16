import type { Metadata, Viewport } from "next";
import "./globals.css";
import DarkModeToggle from "@/components/dark-mode-toggle";

export const metadata: Metadata = {
  title: "Vérité — Chat Wrapped & Red Flag Detector",
  description:
    "Analyse tes conversations WhatsApp. Découvre la vérité derrière chaque message.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    title: "Vérité — Ton crush t'aime vraiment ?",
    description: "Analyse tes conversations WhatsApp pour détecter les red flags, calculer les scores et découvrir la vérité.",
    url: "https://ve-rite.app",
    siteName: "Vérité",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vérité — Analyse WhatsApp",
    description: "Red flags, score d'intérêt, compatibilité… Découvre la vérité sur ta relation.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vérité",
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
