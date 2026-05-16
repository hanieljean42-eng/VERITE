import type { Metadata, Viewport } from "next";
import "./globals.css";
import DarkModeToggle from "@/components/dark-mode-toggle";

export const metadata: Metadata = {
  title: "Vérité — Chat Wrapped & Red Flag Detector",
  description:
    "Analyse tes conversations WhatsApp. Découvre la vérité derrière chaque message.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vérité",
  },
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
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vérité" />
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
