"use client";

import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { parseWhatsAppExport, ParsedChat } from "@/lib/whatsapp-parser";
import { analyzeChat, ChatAnalysis, Gender, RelationType } from "@/lib/analyzer";
import { computeAllFeatures, FeatureResults } from "@/lib/features";
import { detectTemporalPatterns, extractNotableMessages, detectMilestones, generateAdvice, TemporalPattern, NotableMessage, Milestone, Advice } from "@/lib/insights";
import UploadScreen from "@/components/upload-screen";
import SetupScreen from "@/components/setup-screen";

const ResultsScreen = lazy(() => import("@/components/results-screen"));
const Onboarding = lazy(() => import("@/components/onboarding"));
const CompareScreen = lazy(() => import("@/components/compare-screen"));

type Step = "onboarding" | "upload" | "setup" | "loading" | "results" | "compare";

function MiniLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-verite-200 border-t-verite-500 animate-spin" />
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedChat | null>(null);
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [features, setFeatures] = useState<FeatureResults | null>(null);
  const [patterns, setPatterns] = useState<TemporalPattern[]>([]);
  const [notableMessages, setNotableMessages] = useState<NotableMessage[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(0);

  // Check onboarding
  useEffect(() => {
    if (!localStorage.getItem("verite-onboarded")) {
      setStep("onboarding");
    }
  }, []);

  const handleFileLoaded = useCallback((content: string) => {
    const result = parseWhatsAppExport(content);
    if (result.messages.length === 0) {
      const preview = content.substring(0, 200).replace(/[^\x20-\x7E\u00C0-\u017F\n]/g, "?");
      const isEmailBody = content.toLowerCase().includes("joint à cet email") || content.toLowerCase().includes("historique");
      const msg = isEmailBody
        ? `⚠️ Tu as uploadé le CORPS de l'email, pas la pièce jointe !\n\n` +
          `Quand WhatsApp exporte par email, le vrai fichier de discussion est en PIÈCE JOINTE (.txt ou .zip).\n\n` +
          `➡️ Ouvre l'email, télécharge la pièce jointe, puis uploade-la ici.`
        : `Aucun message trouvé dans ce fichier.\n\n` +
          `Aperçu :\n${preview}\n\n` +
          `Assure-toi d'uploader le fichier .txt ou .zip exporté depuis WhatsApp.`;
      alert(msg);
      return;
    }
    setParsed(result);
    setStep("setup");
  }, []);

  // Listen for files shared from WhatsApp via PWA Share Target
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handler = async (event: MessageEvent) => {
        if (event.data?.type === "shared-file") {
          const { buffer, fileName } = event.data;
          if (fileName?.endsWith(".zip")) {
            const JSZip = (await import("jszip")).default;
            const zip = await JSZip.loadAsync(buffer);
            let txtContent: string | null = null;
            for (const [fname, entry] of Object.entries(zip.files)) {
              if (!entry.dir && (fname.endsWith(".txt") || fname.includes("WhatsApp"))) {
                txtContent = await entry.async("string");
                break;
              }
            }
            if (!txtContent) {
              const files = Object.values(zip.files).filter(f => !f.dir);
              if (files.length > 0) txtContent = await files[0].async("string");
            }
            if (txtContent) handleFileLoaded(txtContent);
          } else {
            const text = new TextDecoder("utf-8").decode(buffer);
            handleFileLoaded(text);
          }
        }
      };
      navigator.serviceWorker.addEventListener("message", handler);
      return () => navigator.serviceWorker.removeEventListener("message", handler);
    }
  }, [handleFileLoaded]);

  const handleSetupComplete = useCallback(
    (youName: string, otherName: string, otherGender: Gender, relationType: RelationType) => {
      if (!parsed) return;
      setStep("loading");
      setLoadingMsg(0);

      // Rotate loading messages
      const interval = setInterval(() => {
        setLoadingMsg((p) => (p + 1) % LOADING_MESSAGES.length);
      }, 1800);

      setTimeout(() => {
        clearInterval(interval);
        const result = analyzeChat(parsed, youName, otherName, otherGender, relationType);
        const feat = computeAllFeatures(result);
        const pats = detectTemporalPatterns(result, parsed.messages);
        const notable = extractNotableMessages(parsed.messages, youName, otherName);
        const miles = detectMilestones(parsed.messages, youName, otherName);
        const adv = generateAdvice(result);

        setAnalysis(result);
        setFeatures(feat);
        setPatterns(pats);
        setNotableMessages(notable);
        setMilestones(miles);
        setAdvices(adv);

        // Save to history
        saveToHistory(result, otherName);

        setStep("results");
      }, 3500);
    },
    [parsed]
  );

  const handleReset = useCallback(() => {
    setStep("upload");
    setParsed(null);
    setAnalysis(null);
    setFeatures(null);
    setPatterns([]);
    setNotableMessages([]);
    setMilestones([]);
    setAdvices([]);
  }, []);

  return (
    <main className="min-h-screen">
      <Suspense fallback={<MiniLoader />}>
        {step === "onboarding" && <Onboarding onComplete={() => setStep("upload")} />}
        {step === "upload" && <UploadScreen onFileLoaded={handleFileLoaded} onCompare={() => setStep("compare")} />}
        {step === "compare" && <CompareScreen onBack={() => setStep("upload")} />}
        {step === "setup" && parsed && (
          <SetupScreen
            participants={parsed.participants}
            onComplete={handleSetupComplete}
          />
        )}
        {step === "loading" && <LoadingScreen msgIndex={loadingMsg} />}
        {step === "results" && analysis && features && (
          <ResultsScreen
            analysis={analysis}
            features={features}
            patterns={patterns}
            notableMessages={notableMessages}
            milestones={milestones}
            advices={advices}
            onReset={handleReset}
          />
        )}
      </Suspense>
    </main>
  );
}

// ════════ LOADING ════════
const LOADING_MESSAGES = [
  { text: "Détection des red flags...", emoji: "🚩" },
  { text: "Analyse du temps de réponse...", emoji: "⏱️" },
  { text: "Calcul du niveau d'investissement...", emoji: "📊" },
  { text: "Vérification s'il/elle t'aime vraiment...", emoji: "💀" },
  { text: "Scan des patterns toxiques...", emoji: "☠️" },
  { text: "Comptage des messages ignorés...", emoji: "👻" },
  { text: "Analyse de l'effort de chacun...", emoji: "⚖️" },
  { text: "Extraction des moments clés...", emoji: "⚡" },
  { text: "Préparation du verdict final...", emoji: "⚖️" },
];

function LoadingScreen({ msgIndex }: { msgIndex: number }) {
  const msg = LOADING_MESSAGES[msgIndex];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full animate-spin"
          style={{ border: "4px solid #ede9fe", borderTopColor: "#8b5cf6", borderRightColor: "#f72585" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-pulse">{msg.emoji}</span>
        </div>
      </div>
      <h2 className="text-2xl font-black gradient-text">Analyse en cours...</h2>
      <p className="text-dark-500 text-sm mt-3 text-center h-6 animate-fade-in-up" key={msgIndex}>
        {msg.text}
      </p>
      <div className="mt-8 flex gap-3">
        {["📊", "🚩", "💔", "🔬", "📈"].map((e, i) => (
          <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
            {e}
          </span>
        ))}
      </div>
      <div className="mt-6 w-56 h-2 rounded-full overflow-hidden" style={{ background: "#ede9fe" }}>
        <div className="h-full rounded-full loading-bar" style={{ background: "linear-gradient(90deg, #8b5cf6, #f72585, #ffa62b)" }} />
      </div>
    </div>
  );
}

// ════════ HISTORY ════════
function saveToHistory(analysis: ChatAnalysis, otherName: string) {
  try {
    const history = JSON.parse(localStorage.getItem("verite-history") || "[]");
    history.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      otherName,
      globalScore: analysis.globalScore,
      totalMessages: analysis.totalMessages,
      totalDays: analysis.totalDays,
      redFlags: analysis.redFlags.length,
      greenFlags: analysis.greenFlags.length,
      verdict: analysis.verdict,
      verdictEmoji: analysis.verdictEmoji,
    });
    // Keep only last 10
    localStorage.setItem("verite-history", JSON.stringify(history.slice(0, 10)));
  } catch (e) {
    // Ignore localStorage errors
  }
}
