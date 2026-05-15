import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vérité — Chat Wrapped & Red Flag Detector",
  description:
    "Analyse tes conversations WhatsApp. Découvre la vérité derrière chaque message.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
