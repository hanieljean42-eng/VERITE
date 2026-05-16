"use client";

import { useState } from "react";
import { Gender, RelationType } from "@/lib/analyzer";

const RELATION_OPTIONS: { id: RelationType; label: string; emoji: string; bg: string }[] = [
  { id: "crush", label: "Mon crush", emoji: "😍", bg: "linear-gradient(135deg, #f72585, #fb7aaf)" },
  { id: "partner", label: "Mon couple", emoji: "💑", bg: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
  { id: "ex", label: "Mon ex", emoji: "💔", bg: "linear-gradient(135deg, #ef4444, #f87171)" },
  { id: "situationship", label: "Situationship", emoji: "🤷", bg: "linear-gradient(135deg, #ffa62b, #fbbf24)" },
  { id: "talking", label: "Talking stage", emoji: "💬", bg: "linear-gradient(135deg, #4cc9f0, #06b6d4)" },
  { id: "friend", label: "Ami(e)", emoji: "🤝", bg: "linear-gradient(135deg, #06d6a0, #34d399)" },
  { id: "bestfriend", label: "Meilleur(e) ami(e)", emoji: "🫶", bg: "linear-gradient(135deg, #a855f7, #c084fc)" },
];

interface Props {
  participants: string[];
  onComplete: (youName: string, otherName: string, otherGender: Gender, relationType: RelationType) => void;
}

export default function SetupScreen({ participants, onComplete }: Props) {
  const [youName, setYouName] = useState(participants[0] || "");
  const [otherName, setOtherName] = useState(participants[1] || "");
  const [otherGender, setOtherGender] = useState<Gender | null>(null);
  const [relationType, setRelationType] = useState<RelationType | null>(null);

  const canProceed = youName && otherName && otherGender && relationType;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 animate-float"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #f72585)" }}>
        <span className="text-3xl">⚙️</span>
      </div>
      <h1 className="text-3xl font-black gradient-text mb-1">Configuration</h1>
      <p className="text-dark-500 text-sm mb-8 text-center">
        {participants.length} participants trouvés dans le chat
      </p>

      <div className="w-full max-w-sm space-y-5">
        {/* Qui es-tu ? */}
        <div className="glass-card p-5">
          <label className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3 block">
            👤 Qui es-tu ?
          </label>
          <div className="space-y-2">
            {participants.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setYouName(p);
                  const other = participants.find((x) => x !== p);
                  if (other) setOtherName(other);
                }}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  youName === p
                    ? "text-white font-bold shadow-lg scale-[1.02]"
                    : "bg-white text-dark-600 border border-dark-100 active:bg-dark-50"
                }`}
                style={youName === p ? { background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", boxShadow: "0 4px 15px rgba(139,92,246,0.3)" } : {}}
              >
                {youName === p ? "✓ " : ""}{p}
              </button>
            ))}
          </div>
        </div>

        {/* L'autre personne */}
        {otherName && (
          <div className="glass-card p-5 animate-fade-in-up">
            <label className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-1 block">
              💬 Tu discutes avec
            </label>
            <p className="text-xl font-black text-dark-800 mb-4">{otherName}</p>

            <label className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3 block">
              {otherName} est...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOtherGender("female")}
                className={`flex flex-col items-center gap-2 px-4 py-5 rounded-2xl transition-all ${
                  otherGender === "female"
                    ? "text-white scale-[1.04]"
                    : "bg-white text-dark-600 border border-dark-100 active:bg-dark-50"
                }`}
                style={otherGender === "female" ? { background: "linear-gradient(135deg, #f72585, #fb7aaf)", boxShadow: "0 6px 20px rgba(247,37,133,0.3)" } : {}}
              >
                <span className="text-4xl">👩</span>
                <span className="font-bold text-sm">Une fille</span>
              </button>
              <button
                onClick={() => setOtherGender("male")}
                className={`flex flex-col items-center gap-2 px-4 py-5 rounded-2xl transition-all ${
                  otherGender === "male"
                    ? "text-white scale-[1.04]"
                    : "bg-white text-dark-600 border border-dark-100 active:bg-dark-50"
                }`}
                style={otherGender === "male" ? { background: "linear-gradient(135deg, #4cc9f0, #06b6d4)", boxShadow: "0 6px 20px rgba(76,201,240,0.3)" } : {}}
              >
                <span className="text-4xl">👨</span>
                <span className="font-bold text-sm">Un garçon</span>
              </button>
            </div>
          </div>
        )}

        {/* Type de relation */}
        {otherGender && (
          <div className="glass-card p-5 animate-fade-in-up">
            <label className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3 block">
              💫 C'est quoi entre vous ?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RELATION_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRelationType(r.id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl text-sm font-medium transition-all ${
                    relationType === r.id
                      ? "text-white scale-[1.03]"
                      : "bg-white text-dark-600 border border-dark-100 active:bg-dark-50"
                  }`}
                  style={relationType === r.id ? { background: r.bg, boxShadow: "0 4px 15px rgba(0,0,0,0.15)" } : {}}
                >
                  <span className="text-xl">{r.emoji}</span>
                  <span className="font-bold text-xs">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bouton continuer */}
        <button
          onClick={() => canProceed && onComplete(youName, otherName, otherGender!, relationType!)}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            canProceed
              ? "btn-primary active:scale-[0.97]"
              : "bg-dark-100 text-dark-400 cursor-not-allowed"
          }`}
        >
          🔍 Analyser la conversation
        </button>
      </div>
    </div>
  );
}
