"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { ChatAnalysis } from "@/lib/analyzer";
import { getScoreLabel } from "@/lib/insights";

interface Props {
  analysis: ChatAnalysis;
  onClose: () => void;
}

export default function ShareCard({ analysis, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const scoreInfo = getScoreLabel(analysis.globalScore);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "verite-resultats.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Mes résultats Vérité",
            text: "Découvre la vérité sur tes conversations WhatsApp 👀",
          });
        } else {
          downloadImage(blob);
        }
      } else {
        downloadImage(blob);
      }
    } catch (e) {
      // User cancelled share
    }
    setSharing(false);
  };

  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verite-resultats.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm">
        {/* Card preview */}
        <div
          ref={cardRef}
          className="rounded-3xl p-6 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
          }}
        >
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-black text-white mb-1">Vérité</h2>
            <p className="text-white/50 text-xs">Analyse de conversation</p>
          </div>

          {/* Global Score */}
          <div className="mb-5">
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-2"
              style={{
                background: `conic-gradient(${scoreInfo.color} ${analysis.globalScore}%, rgba(255,255,255,0.1) 0)`,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                <span className="text-3xl font-black text-white">{analysis.globalScore}</span>
              </div>
            </div>
            <p className="text-white font-bold text-sm">{scoreInfo.emoji} {scoreInfo.label}</p>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-lg font-black text-white">{analysis.effortScore}%</p>
              <p className="text-[9px] text-white/60">Effort</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-lg font-black text-white">{analysis.compatibilityScore}%</p>
              <p className="text-[9px] text-white/60">Compat.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-lg font-black text-white">{analysis.interestScore}%</p>
              <p className="text-[9px] text-white/60">Intérêt</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-lg font-black text-white">{Math.max(0, 100 - analysis.toxicityScore)}%</p>
              <p className="text-[9px] text-white/60">Santé</p>
            </div>
          </div>

          {/* Red/Green flags count */}
          <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🚩</span>
              <span className="text-white font-bold text-sm">{analysis.redFlags.length} red flags</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💚</span>
              <span className="text-white font-bold text-sm">{analysis.greenFlags.length} positifs</span>
            </div>
          </div>

          {/* Verdict */}
          <div className="bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <p className="text-white/90 text-xs leading-relaxed">{analysis.verdict}</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-4 text-white/70 text-[10px]">
            <span>{analysis.totalMessages} msgs</span>
            <span>•</span>
            <span>{analysis.totalDays} jours</span>
            <span>•</span>
            <span>{analysis.avgMessagesPerDay} msg/j</span>
          </div>

          {/* Watermark */}
          <p className="text-white/30 text-[10px] mt-4">verite.app — Powered by Haniel_dev</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-bold bg-white/10 text-white backdrop-blur-sm border border-white/20"
          >
            Fermer
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #f72585)" }}
          >
            {sharing ? "..." : "📤 Partager"}
          </button>
        </div>
      </div>
    </div>
  );
}
