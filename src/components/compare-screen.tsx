"use client";

import { useState, useCallback, useRef } from "react";
import JSZip from "jszip";
import { parseWhatsAppExport, ParsedChat } from "@/lib/whatsapp-parser";
import { analyzeChat, ChatAnalysis, Gender, RelationType } from "@/lib/analyzer";
import { getScoreLabel } from "@/lib/insights";

interface Props {
  onBack: () => void;
}

interface CompareSlot {
  parsed?: ParsedChat;
  analysis?: ChatAnalysis;
  label: string;
}

export default function CompareScreen({ onBack }: Props) {
  const [slots, setSlots] = useState<[CompareSlot, CompareSlot]>([
    { label: "Conversation 1" },
    { label: "Conversation 2" },
  ]);
  const [activeSlot, setActiveSlot] = useState<0 | 1 | null>(null);
  const [setupSlot, setSetupSlot] = useState<0 | 1 | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(async (file: File): Promise<string | null> => {
    const isZip = file.name.endsWith(".zip") || file.type === "application/zip";
    if (isZip) {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      for (const [fname, entry] of Object.entries(zip.files)) {
        if (!entry.dir && (fname.endsWith(".txt") || fname.includes("WhatsApp"))) {
          const bytes = await entry.async("uint8array");
          return new TextDecoder("utf-8").decode(bytes);
        }
      }
      for (const [, entry] of Object.entries(zip.files)) {
        if (!entry.dir) {
          const bytes = await entry.async("uint8array");
          return new TextDecoder("utf-8").decode(bytes);
        }
      }
      return null;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsText(file, "utf-8");
    });
  }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSlot === null) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await readFile(file);
    if (!content) { alert("Erreur de lecture"); return; }
    const parsed = parseWhatsAppExport(content);
    if (parsed.messages.length === 0) { alert("Aucun message trouvé"); return; }
    const newSlots = [...slots] as [CompareSlot, CompareSlot];
    newSlots[activeSlot] = { ...newSlots[activeSlot], parsed, label: parsed.participants[1] || `Conv ${activeSlot + 1}` };
    setSlots(newSlots);
    setSetupSlot(activeSlot);
    setActiveSlot(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [activeSlot, readFile, slots]);

  const handleSetup = (slotIdx: 0 | 1, youName: string, otherName: string, gender: Gender, rel: RelationType) => {
    const parsed = slots[slotIdx].parsed;
    if (!parsed) return;
    const analysis = analyzeChat(parsed, youName, otherName, gender, rel);
    const newSlots = [...slots] as [CompareSlot, CompareSlot];
    newSlots[slotIdx] = { ...newSlots[slotIdx], analysis, label: otherName };
    setSlots(newSlots);
    setSetupSlot(null);
  };

  const bothReady = slots[0].analysis && slots[1].analysis;

  // Mini setup form
  if (setupSlot !== null && slots[setupSlot].parsed) {
    const parsed = slots[setupSlot].parsed!;
    return (
      <MiniSetup
        participants={parsed.participants}
        slotIndex={setupSlot}
        onComplete={handleSetup}
        onCancel={() => setSetupSlot(null)}
      />
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={handleFile} />

      {/* Header */}
      <div className="text-center mb-6">
        <button onClick={onBack} className="text-dark-400 text-sm mb-4 inline-block">← Retour</button>
        <h1 className="text-2xl font-black gradient-text">Mode Comparaison</h1>
        <p className="text-dark-500 text-sm mt-1">Compare 2 conversations pour savoir qui s'intéresse le plus à toi</p>
      </div>

      {/* Slots */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => { setActiveSlot(i as 0 | 1); fileRef.current?.click(); }}
            className={`glass-card p-5 text-center transition-all active:scale-[0.97] ${
              slot.analysis ? "border-2 border-verite-300" : "border-2 border-dashed border-dark-200"
            }`}
          >
            {slot.analysis ? (
              <>
                <div className="text-3xl mb-2"
                  style={{ color: getScoreLabel(slot.analysis.globalScore).color }}>
                  {slot.analysis.globalScore}
                </div>
                <p className="text-xs font-bold text-dark-700 truncate">{slot.label}</p>
                <p className="text-[10px] text-dark-500">{slot.analysis.totalMessages} msgs</p>
                <p className="text-[10px]" style={{ color: getScoreLabel(slot.analysis.globalScore).color }}>
                  {getScoreLabel(slot.analysis.globalScore).emoji} {getScoreLabel(slot.analysis.globalScore).label}
                </p>
              </>
            ) : (
              <>
                <span className="text-3xl">📂</span>
                <p className="text-xs font-bold text-dark-500 mt-2">Conv {i + 1}</p>
                <p className="text-[10px] text-dark-400">Appuie pour charger</p>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Comparison results */}
      {bothReady && (
        <CompareResults a={slots[0].analysis!} b={slots[1].analysis!} nameA={slots[0].label} nameB={slots[1].label} />
      )}
    </div>
  );
}

function MiniSetup({ participants, slotIndex, onComplete, onCancel }: {
  participants: string[];
  slotIndex: 0 | 1;
  onComplete: (slot: 0 | 1, you: string, other: string, g: Gender, r: RelationType) => void;
  onCancel: () => void;
}) {
  const [you, setYou] = useState(participants[0] || "");
  const other = participants.find(p => p !== you) || participants[1] || "";
  const [gender, setGender] = useState<Gender>("female");
  const [rel, setRel] = useState<RelationType>("crush");

  return (
    <div className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black gradient-text">Configuration Conv {slotIndex + 1}</h2>
      </div>
      <div className="glass-card p-5 space-y-4">
        <div>
          <p className="text-xs font-bold text-dark-600 mb-2">Qui es-tu ?</p>
          <div className="flex gap-2">
            {participants.map(p => (
              <button key={p} onClick={() => setYou(p)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  you === p ? "text-white" : "bg-dark-50 text-dark-600"
                }`}
                style={you === p ? { background: "linear-gradient(135deg, #8b5cf6, #f72585)" } : {}}>
                {p.slice(0, 12)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-dark-600 mb-2">Genre de {other.slice(0, 10)}</p>
          <div className="flex gap-2">
            <button onClick={() => setGender("female")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold ${gender === "female" ? "bg-accent-pink text-white" : "bg-dark-50 text-dark-600"}`}>
              👩 Femme
            </button>
            <button onClick={() => setGender("male")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold ${gender === "male" ? "bg-verite-500 text-white" : "bg-dark-50 text-dark-600"}`}>
              👨 Homme
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-dark-600 mb-2">Type de relation</p>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { id: "crush", label: "Crush" },
              { id: "partner", label: "Couple" },
              { id: "ex", label: "Ex" },
              { id: "friend", label: "Ami(e)" },
              { id: "bestfriend", label: "BFF" },
              { id: "situationship", label: "Flou" },
            ] as { id: RelationType; label: string }[]).map(r => (
              <button key={r.id} onClick={() => setRel(r.id)}
                className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                  rel === r.id ? "text-white" : "bg-dark-50 text-dark-600"
                }`}
                style={rel === r.id ? { background: "linear-gradient(135deg, #8b5cf6, #f72585)" } : {}}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-bold bg-dark-50 text-dark-500">
            Annuler
          </button>
          <button onClick={() => onComplete(slotIndex, you, other, gender, rel)}
            className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary">
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

function CompareResults({ a, b, nameA, nameB }: { a: ChatAnalysis; b: ChatAnalysis; nameA: string; nameB: string }) {
  const scoreA = getScoreLabel(a.globalScore);
  const scoreB = getScoreLabel(b.globalScore);
  const winner = a.globalScore > b.globalScore ? nameA : a.globalScore < b.globalScore ? nameB : "Égalité";

  const comparisons = [
    { label: "Score global", vA: a.globalScore, vB: b.globalScore, unit: "/100" },
    { label: "Effort", vA: a.effortScore, vB: b.effortScore, unit: "%" },
    { label: "Compatibilité", vA: a.compatibilityScore, vB: b.compatibilityScore, unit: "%" },
    { label: "Intérêt", vA: a.interestScore, vB: b.interestScore, unit: "%" },
    { label: "Toxicité", vA: a.toxicityScore, vB: b.toxicityScore, unit: "%", inverse: true },
    { label: "Red flags", vA: a.redFlags.length, vB: b.redFlags.length, unit: "", inverse: true },
    { label: "Messages", vA: a.totalMessages, vB: b.totalMessages, unit: "" },
    { label: "Ratio msgs", vA: a.messageRatio, vB: b.messageRatio, unit: "" },
    { label: "Rép. moy.", vA: a.other.avgResponseTimeMin, vB: b.other.avgResponseTimeMin, unit: "min", inverse: true },
  ];

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Winner */}
      <div className="glass-card p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(247,37,133,0.06))" }}>
        <span className="text-4xl">🏆</span>
        <p className="text-lg font-black gradient-text mt-2">
          {winner === "Égalité" ? "Égalité parfaite !" : `${winner} gagne !`}
        </p>
        <p className="text-xs text-dark-500 mt-1">
          {winner !== "Égalité"
            ? `${winner} montre plus d'intérêt et d'efforts dans la conversation`
            : "Les deux montrent un niveau d'intérêt similaire"
          }
        </p>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-black" style={{ color: scoreA.color }}>{a.globalScore}</p>
          <p className="text-xs font-bold text-dark-700 truncate">{nameA}</p>
          <p className="text-[10px]" style={{ color: scoreA.color }}>{scoreA.emoji} {scoreA.label}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-black" style={{ color: scoreB.color }}>{b.globalScore}</p>
          <p className="text-xs font-bold text-dark-700 truncate">{nameB}</p>
          <p className="text-[10px]" style={{ color: scoreB.color }}>{scoreB.emoji} {scoreB.label}</p>
        </div>
      </div>

      {/* Detailed comparison */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-dark-700 mb-3">📊 Comparaison détaillée</h3>
        <div className="space-y-2.5">
          {comparisons.map((c) => {
            const betterA = c.inverse ? c.vA < c.vB : c.vA > c.vB;
            const betterB = c.inverse ? c.vB < c.vA : c.vB > c.vA;
            return (
              <div key={c.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className={`font-bold ${betterA ? "text-accent-cyan" : "text-dark-500"}`}>
                    {typeof c.vA === "number" ? (Number.isInteger(c.vA) ? c.vA : c.vA.toFixed(2)) : c.vA}{c.unit}
                  </span>
                  <span className="text-dark-600 font-medium">{c.label}</span>
                  <span className={`font-bold ${betterB ? "text-accent-cyan" : "text-dark-500"}`}>
                    {typeof c.vB === "number" ? (Number.isInteger(c.vB) ? c.vB : c.vB.toFixed(2)) : c.vB}{c.unit}
                  </span>
                </div>
                <div className="flex h-1.5 gap-0.5">
                  <div className="flex-1 bg-dark-100 rounded-full overflow-hidden flex justify-end">
                    <div className={`h-full rounded-full ${betterA ? "bg-accent-cyan" : "bg-dark-300"}`}
                      style={{ width: `${Math.min(100, (Math.abs(Number(c.vA)) / Math.max(Math.abs(Number(c.vA)), Math.abs(Number(c.vB)), 1)) * 100)}%` }} />
                  </div>
                  <div className="flex-1 bg-dark-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${betterB ? "bg-accent-cyan" : "bg-dark-300"}`}
                      style={{ width: `${Math.min(100, (Math.abs(Number(c.vB)) / Math.max(Math.abs(Number(c.vA)), Math.abs(Number(c.vB)), 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-dark-400 mt-2">
          <span>{nameA}</span>
          <span>{nameB}</span>
        </div>
      </div>

      {/* Verdicts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3">
          <p className="text-xs font-bold text-dark-700 mb-1">{a.verdictEmoji} {nameA}</p>
          <p className="text-[10px] text-dark-500 leading-relaxed">{a.verdict}</p>
        </div>
        <div className="glass-card p-3">
          <p className="text-xs font-bold text-dark-700 mb-1">{b.verdictEmoji} {nameB}</p>
          <p className="text-[10px] text-dark-500 leading-relaxed">{b.verdict}</p>
        </div>
      </div>
    </div>
  );
}
