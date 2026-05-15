"use client";

import { useState, useCallback, useEffect } from "react";
import { parseWhatsAppExport, ParsedChat } from "@/lib/whatsapp-parser";
import { analyzeChat, ChatAnalysis, Gender } from "@/lib/analyzer";
import { computeAllFeatures, FeatureResults } from "@/lib/features";
import UploadScreen from "@/components/upload-screen";
import SetupScreen from "@/components/setup-screen";
import ResultsScreen from "@/components/results-screen";

type Step = "upload" | "setup" | "loading" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedChat | null>(null);
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [features, setFeatures] = useState<FeatureResults | null>(null);

  const handleFileLoaded = useCallback((content: string) => {
    const result = parseWhatsAppExport(content);
    if (result.messages.length === 0) {
      alert("Aucun message trouvé. Vérifie que c'est bien un export WhatsApp.");
      return;
    }
    setParsed(result);
    setStep("setup");
  }, []);

  // Listen for files shared from WhatsApp via PWA Share Target
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "shared-file" && event.data.text) {
          handleFileLoaded(event.data.text);
        }
      };
      navigator.serviceWorker.addEventListener("message", handler);
      return () => navigator.serviceWorker.removeEventListener("message", handler);
    }
  }, [handleFileLoaded]);

  const handleSetupComplete = useCallback(
    (youName: string, otherName: string, otherGender: Gender) => {
      if (!parsed) return;
      setStep("loading");
      setTimeout(() => {
        const result = analyzeChat(parsed, youName, otherName, otherGender);
        const feat = computeAllFeatures(result);
        setAnalysis(result);
        setFeatures(feat);
        setStep("results");
      }, 2000);
    },
    [parsed]
  );

  const handleReset = useCallback(() => {
    setStep("upload");
    setParsed(null);
    setAnalysis(null);
    setFeatures(null);
  }, []);

  return (
    <main className="min-h-screen">
      {step === "upload" && <UploadScreen onFileLoaded={handleFileLoaded} />}
      {step === "setup" && parsed && (
        <SetupScreen
          participants={parsed.participants}
          onComplete={handleSetupComplete}
        />
      )}
      {step === "loading" && <LoadingScreen />}
      {step === "results" && analysis && features && (
        <ResultsScreen analysis={analysis} features={features} onReset={handleReset} />
      )}
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full animate-spin"
          style={{ border: "4px solid #ede9fe", borderTopColor: "#8b5cf6", borderRightColor: "#f72585" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl animate-pulse">🔍</span>
        </div>
      </div>
      <h2 className="text-2xl font-black gradient-text">Analyse en cours...</h2>
      <p className="text-dark-500 text-sm mt-2 text-center">Détection des red flags, calcul des scores...</p>
      <div className="mt-8 flex gap-3">
        {["📊", "🚩", "💔", "🔬", "📈"].map((e, i) => (
          <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
            {e}
          </span>
        ))}
      </div>
      <div className="mt-6 w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "#ede9fe" }}>
        <div className="h-full rounded-full animate-pulse" style={{ background: "linear-gradient(90deg, #8b5cf6, #f72585, #ffa62b)", width: "70%" }} />
      </div>
    </div>
  );
}
