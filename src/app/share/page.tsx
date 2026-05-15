"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SharePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page — the service worker will handle the file
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full animate-spin mx-auto mb-4"
          style={{ border: "4px solid #ede9fe", borderTopColor: "#8b5cf6" }} />
        <p className="text-dark-500 text-sm">Chargement du fichier...</p>
      </div>
    </div>
  );
}
