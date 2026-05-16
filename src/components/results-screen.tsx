"use client";

import { ChatAnalysis } from "@/lib/analyzer";
import { FeatureResults } from "@/lib/features";
import { TemporalPattern, NotableMessage, Milestone, Advice, getScoreLabel } from "@/lib/insights";
import { useState } from "react";
import ShareCard from "./share-card";

interface Props {
  analysis: ChatAnalysis;
  features: FeatureResults;
  patterns: TemporalPattern[];
  notableMessages: NotableMessage[];
  milestones: Milestone[];
  advices: Advice[];
  onReset: () => void;
}

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function Ring({ value, size = 64, stroke = 5, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ede9fe" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color }}>{value}%</span>
    </div>
  );
}

function Stat({ icon, val, label, sub }: { icon: string; val: string | number; label: string; sub?: string }) {
  return (
    <div className="stat-card">
      <span className="text-lg">{icon}</span>
      <div className="text-lg font-black leading-tight mt-1 text-dark-800">{val}</div>
      <div className="text-[10px] text-dark-500 leading-tight">{label}</div>
      {sub && <div className="text-[9px] text-dark-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Bar({ label, a, b, nameA, nameB }: { label: string; a: number; b: number; nameA: string; nameB: string }) {
  const t = a + b || 1;
  const pA = Math.round((a / t) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-verite-600 font-semibold">{nameA}: {a}</span>
        <span className="text-dark-500 font-medium">{label}</span>
        <span className="text-accent-cyan font-semibold">{nameB}: {b}</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: "#ede9fe" }}>
        <div className="rounded-l-full transition-all duration-500" style={{ width: `${pA}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }} />
        <div className="rounded-r-full transition-all duration-500" style={{ width: `${100 - pA}%`, background: "linear-gradient(90deg, #06d6a0, #34d399)" }} />
      </div>
    </div>
  );
}

function MiniChart({ you, other }: { you: number[]; other: number[] }) {
  const max = Math.max(...you, ...other, 1);
  return (
    <div className="flex items-end gap-[1px] h-20">
      {you.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col gap-[0.5px] justify-end">
          <div className="bg-accent-cyan/60 rounded-t-sm" style={{ height: `${(other[i] / max) * 100}%` }} />
          <div className="bg-verite-500 rounded-t-sm" style={{ height: `${(v / max) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function ResultsScreen({ analysis, features, patterns, notableMessages, milestones, advices, onReset }: Props) {
  const { you, other, otherGender } = analysis;
  type Tab = "overview" | "features" | "you" | "other" | "flags" | "deep" | "timeline" | "conseils";
  const [tab, setTab] = useState<Tab>("overview");
  const [showShare, setShowShare] = useState(false);
  const gLabel = otherGender === "female" ? "Elle" : "Il";
  const scoreInfo = getScoreLabel(analysis.globalScore);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Global", icon: "📊" },
    { id: "features", label: "Aperçus", icon: "✨" },
    { id: "flags", label: "Alertes", icon: "🚩" },
    { id: "timeline", label: "Timeline", icon: "📅" },
    { id: "conseils", label: "Conseils", icon: "💡" },
    { id: "you", label: "Toi", icon: "👤" },
    { id: "other", label: other.name.slice(0, 8), icon: otherGender === "female" ? "👩" : "👨" },
    { id: "deep", label: "Profond", icon: "🔬" },
  ];

  return (
    <div className="min-h-screen pb-16 max-w-lg mx-auto">
      {showShare && <ShareCard analysis={analysis} onClose={() => setShowShare(false)} />}

      {/* Header with global score */}
      <div className="text-center pt-8 pb-4 px-5">
        {/* Score global */}
        <div className="relative w-28 h-28 mx-auto mb-4">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle cx="56" cy="56" r="48" stroke="#ede9fe" strokeWidth="8" fill="none" />
            <circle cx="56" cy="56" r="48" stroke={scoreInfo.color} strokeWidth="8" fill="none"
              strokeDasharray={`${2 * Math.PI * 48}`}
              strokeDashoffset={`${2 * Math.PI * 48 * (1 - analysis.globalScore / 100)}`}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color: scoreInfo.color }}>{analysis.globalScore}</span>
            <span className="text-[10px] text-dark-500">/100</span>
          </div>
        </div>
        <p className="text-lg font-bold" style={{ color: scoreInfo.color }}>{scoreInfo.emoji} {scoreInfo.label}</p>
        <h1 className="text-xl font-black gradient-text mt-1">Vérité Résumé</h1>
        <p className="text-dark-500 text-sm mt-2 leading-snug px-2">{analysis.verdict}</p>

        {/* Share button */}
        <button
          onClick={() => setShowShare(true)}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #f72585)" }}
        >
          📤 Partager en Story
        </button>
      </div>

      {/* Score rings - 2x2 grid mobile */}
      <div className="grid grid-cols-4 gap-2 px-5 py-3 glass-card mx-4 mb-2">
        <div className="flex flex-col items-center gap-1">
          <Ring value={analysis.effortScore} color="#8b5cf6" />
          <span className="text-[9px] text-dark-500">Effort</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring value={analysis.compatibilityScore} color="#06d6a0" />
          <span className="text-[9px] text-dark-500">Compat.</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring value={analysis.interestScore} color="#4cc9f0" />
          <span className="text-[9px] text-dark-500">Intérêt</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring value={Math.max(0, 100 - analysis.toxicityScore)} color={analysis.toxicityScore > 50 ? "#ff6b6b" : "#06d6a0"} />
          <span className="text-[9px] text-dark-500">Santé</span>
        </div>
      </div>

      {/* Tabs scrollable */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.id
                ? "text-white shadow-lg"
                : "bg-white text-dark-500 border border-dark-100 active:bg-dark-50"
            }`}
            style={tab === t.id ? { background: "linear-gradient(135deg, #8b5cf6, #f72585)", boxShadow: "0 4px 15px rgba(139,92,246,0.3)" } : {}}
          >
            <span className="text-sm">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 mt-3 space-y-3">

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Stat icon="💬" val={analysis.totalMessages.toLocaleString()} label="Messages" />
              <Stat icon="📝" val={analysis.totalWords.toLocaleString()} label="Mots" />
              <Stat icon="📅" val={`${analysis.totalDays}j`} label="Durée" />
              <Stat icon="📈" val={analysis.avgMessagesPerDay} label="Msg/jour" />
              <Stat icon="🔥" val={`${analysis.longestStreak}j`} label="Série max" />
              <Stat icon="⏰" val={`${analysis.peakHour}h`} label="Pic" />
            </div>

            {/* Comparaisons */}
            <div className="glass-card p-4">
              <h3 className="section-title">⚖️ Comparaison</h3>
              <Bar label="Messages" a={you.totalMessages} b={other.totalMessages} nameA="Toi" nameB={other.name} />
              <Bar label="Mots" a={you.totalWords} b={other.totalWords} nameA="Toi" nameB={other.name} />
              <Bar label="Emojis" a={you.totalEmojis} b={other.totalEmojis} nameA="Toi" nameB={other.name} />
              <Bar label="Questions" a={you.totalQuestions} b={other.totalQuestions} nameA="Toi" nameB={other.name} />
              <Bar label="Initiative" a={you.initiations} b={other.initiations} nameA="Toi" nameB={other.name} />
              <Bar label="Rires 😂" a={you.laughCount} b={other.laughCount} nameA="Toi" nameB={other.name} />
              <Bar label="Amour ❤️" a={you.loveCount} b={other.loveCount} nameA="Toi" nameB={other.name} />
              <Bar label="Double txt" a={you.doubleTexts} b={other.doubleTexts} nameA="Toi" nameB={other.name} />
              <Bar label="Supprimés" a={you.totalDeleted} b={other.totalDeleted} nameA="Toi" nameB={other.name} />
            </div>

            {/* Activité horaire */}
            <div className="glass-card p-4">
              <h3 className="section-title">🕐 Activité/heure</h3>
              <MiniChart you={you.messagesByHour} other={other.messagesByHour} />
              <div className="flex gap-3 mt-2 text-[10px] text-dark-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-verite-500 rounded-sm" />Toi</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent-cyan rounded-sm" />{other.name}</span>
              </div>
            </div>

            {/* Jours de la semaine */}
            <div className="glass-card p-4">
              <h3 className="section-title">📅 Par jour</h3>
              <div className="flex gap-1">
                {DAY_NAMES.map((d, i) => {
                  const total = you.messagesByDay[i] + other.messagesByDay[i];
                  const max = Math.max(...you.messagesByDay.map((v, j) => v + other.messagesByDay[j]), 1);
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full h-12 flex flex-col justify-end gap-[0.5px]">
                        <div className="bg-accent-cyan/60 rounded-t" style={{ height: `${(other.messagesByDay[i] / max) * 100}%` }} />
                        <div className="bg-verite-500 rounded-t" style={{ height: `${(you.messagesByDay[i] / max) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-dark-500">{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Emoji War */}
            {analysis.emojiWar.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="section-title">😀 Bataille d'Emojis</h3>
                {analysis.emojiWar.map((e) => (
                  <div key={e.emoji} className="flex items-center gap-2 mb-2">
                    <span className="text-xl w-7 text-center">{e.emoji}</span>
                    <div className="flex-1"><Bar label="" a={e.you} b={e.other} nameA="Toi" nameB={other.name} /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Top mots */}
            <div className="glass-card p-4">
              <h3 className="section-title">🔤 Top mots</h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.topSharedWords.slice(0, 12).map((w) => (
                  <span key={w.word} className="px-2 py-0.5 rounded-full bg-dark-50 text-[11px] text-dark-600">
                    {w.word} <span className="text-verite-400 font-bold">×{w.count}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {analysis.messagesByMonth.length > 1 && (
              <div className="glass-card p-4">
                <h3 className="section-title">📈 Évolution</h3>
                <div className="flex items-end gap-[2px] h-16 overflow-x-auto scrollbar-hide">
                  {analysis.messagesByMonth.map((m) => {
                    const max = Math.max(...analysis.messagesByMonth.map((x) => x.you + x.other), 1);
                    return (
                      <div key={m.month} className="flex flex-col items-center min-w-[12px]">
                        <div className="w-2.5 bg-gradient-to-t from-verite-600 to-accent-cyan rounded-t"
                          style={{ height: `${((m.you + m.other) / max) * 100}%` }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ INSIGHTS ═══ */}
        {tab === "features" && (
          <>
            {/* Attachment */}
            <div className="glass-card p-4 border-l-[3px] border-verite-500">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{features.attachment.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{features.attachment.title}</p>
                  <p className="text-[11px] text-dark-500 mt-0.5 leading-snug">{features.attachment.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {features.attachment.traits.map((t) => (<span key={t} className="badge-blue">{t}</span>))}
                  </div>
                </div>
              </div>
            </div>

            {/* Texter types */}
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3 text-center">
                <p className="text-[9px] text-dark-500 uppercase tracking-wider">Toi</p>
                <span className="text-2xl block mt-1">{features.texterType.emoji}</span>
                <p className="font-bold text-xs mt-1">{features.texterType.title}</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-[9px] text-dark-500 uppercase tracking-wider">{other.name}</p>
                <span className="text-2xl block mt-1">{features.otherTexterType.emoji}</span>
                <p className="font-bold text-xs mt-1">{features.otherTexterType.title}</p>
              </div>
            </div>

            {/* Investment */}
            <div className="glass-card p-4">
              <h3 className="section-title">💰 Investissement</h3>
              <div className="flex items-center">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-dark-500">Toi</p>
                  <p className="text-2xl font-black text-verite-600">{features.investment.you}%</p>
                </div>
                <span className="text-xl text-dark-500 px-2">
                  {features.investment.winner === "equal" ? "=" : features.investment.winner === "you" ? "›" : "‹"}
                </span>
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-dark-500">{other.name}</p>
                  <p className="text-2xl font-black text-accent-cyan">{features.investment.other}%</p>
                </div>
              </div>
              <p className="text-[10px] text-dark-400 text-center mt-2">{features.investment.description}</p>
            </div>

            {/* Toxicity */}
            <div className="glass-card p-4">
              <h3 className="section-title">☠️ Toxicité</h3>
              <div className="space-y-2.5">
                {[
                  { l: "Manipulation", v: features.toxicity.manipulation, c: "bg-red-500" },
                  { l: "Bombardement affectif", v: features.toxicity.loveBombing, c: "bg-accent-pink" },
                  { l: "Disparitions", v: features.toxicity.ghosting, c: "bg-verite-500" },
                  { l: "Miettes d'attention", v: features.toxicity.breadcrumbing, c: "bg-accent-orange" },
                  { l: "Effort unilatéral", v: features.toxicity.oneWayEffort, c: "bg-amber-500" },
                ].map((x) => (
                  <div key={x.l}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-dark-600">{x.l}</span>
                      <span className="font-bold">{x.v}%</span>
                    </div>
                    <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${x.c} transition-all duration-700`} style={{ width: `${x.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-dark-500 mt-3">{features.toxicity.description}</p>
            </div>

            {/* Ick */}
            <div className="glass-card p-4">
              <h3 className="section-title">🤢 Indice Beurk</h3>
              <div className="flex items-center gap-3 mb-3">
                <Ring value={features.ickScore} size={56} stroke={4}
                  color={features.ickScore > 60 ? "#ff6b6b" : features.ickScore > 30 ? "#ffa62b" : "#06d6a0"} />
                <div>
                  <p className="font-bold text-sm">{features.ickScore > 60 ? "Niveau beurk élevé" : features.ickScore > 30 ? "Quelques beurks" : "Peu de beurks"}</p>
                  <p className="text-[10px] text-dark-400">{features.ickReasons.length} comportements détectés</p>
                </div>
              </div>
              {features.ickReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-dark-50 px-2.5 py-1.5 rounded-lg text-[11px] text-dark-600 mb-1">
                  <span>🤮</span><span>{r}</span>
                </div>
              ))}
            </div>

            {/* Momentum */}
            <div className="glass-card p-4">
              <h3 className="section-title">{features.momentum.emoji} Dynamique</h3>
              <p className="text-xs text-dark-600">{features.momentum.description}</p>
            </div>

            {/* Compatibility grid */}
            <div className="glass-card p-4">
              <h3 className="section-title">💫 Compatibilité</h3>
              <div className="grid grid-cols-3 gap-2">
                {features.compatibilityDetails.map((c) => (
                  <div key={c.category} className="text-center bg-dark-50 p-2 rounded-xl">
                    <span>{c.emoji}</span>
                    <p className="text-sm font-black mt-0.5" style={{ color: c.score > 70 ? "#06d6a0" : c.score > 40 ? "#ffa62b" : "#ff6b6b" }}>{c.score}%</p>
                    <p className="text-[9px] text-dark-500">{c.category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vocabulary */}
            <div className="glass-card p-4">
              <h3 className="section-title">📖 Vocabulaire</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-dark-500">Toi</p>
                  <p className="text-2xl font-black text-verite-600">{features.vocabulary.you.richness}%</p>
                  <p className="text-[9px] text-dark-500">{features.vocabulary.you.uniqueWords} uniques</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-dark-500">{other.name}</p>
                  <p className="text-2xl font-black text-accent-cyan">{features.vocabulary.other.richness}%</p>
                  <p className="text-[9px] text-dark-500">{features.vocabulary.other.uniqueWords} uniques</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ TOI / AUTRE ═══ */}
        {(tab === "you" || tab === "other") && (() => {
          const p = tab === "you" ? you : other;
          const title = tab === "you" ? "Tes stats" : `Stats de ${other.name}`;
          const ic = tab === "you" ? "👤" : otherGender === "female" ? "👩" : "👨";
          return (
            <>
              <h2 className="text-base font-bold flex items-center gap-2">{ic} {title}</h2>
              <div className="grid grid-cols-3 gap-2">
                <Stat icon="💬" val={p.totalMessages.toLocaleString()} label="Messages" sub={`${Math.round((p.totalMessages / analysis.totalMessages) * 100)}%`} />
                <Stat icon="📝" val={p.totalWords.toLocaleString()} label="Mots" />
                <Stat icon="🔤" val={p.totalChars.toLocaleString()} label="Caractères" />
                <Stat icon="📏" val={p.avgWordsPerMessage} label="Mots/msg" />
                <Stat icon="😊" val={p.totalEmojis} label="Emojis" />
                <Stat icon="❓" val={p.totalQuestions} label="Questions" />
                <Stat icon="📷" val={p.totalMedia} label="Médias" />
                <Stat icon="🗑️" val={p.totalDeleted} label="Supprimés" />
                <Stat icon="😂" val={p.laughCount} label="Rires" />
                <Stat icon="❤️" val={p.loveCount} label="Amour" />
                <Stat icon="🌅" val={p.initiations} label="Initie" />
                <Stat icon="📱" val={p.doubleTexts} label="Relances" />
                <Stat icon="⏱️" val={`${p.avgResponseTimeMin}m`} label="Rép. moy." />
                <Stat icon="⚡" val={`${p.fastestResponseMin}m`} label="Plus rapide" />
                <Stat icon="👻" val={p.ghostCount} label="Disparitions" />
                <Stat icon="📅" val={p.activeDays} label="Jours actifs" />
                <Stat icon="📊" val={p.messagesPerActiveDay} label="Msg/jour" />
                <Stat icon="🔗" val={p.totalLinks} label="Liens" />
              </div>
              {p.topEmojis.length > 0 && (
                <div className="glass-card p-3">
                  <p className="text-xs font-bold mb-2">Top Emojis</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.topEmojis.map((e) => (
                      <span key={e.emoji} className="flex items-center gap-0.5 bg-dark-50 px-2 py-1 rounded-lg text-sm">
                        {e.emoji}<span className="text-[10px] font-bold text-verite-600">×{e.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {p.topWords.length > 0 && (
                <div className="glass-card p-3">
                  <p className="text-xs font-bold mb-2">Top Mots</p>
                  <div className="flex flex-wrap gap-1">
                    {p.topWords.slice(0, 15).map((w) => (
                      <span key={w.word} className="px-2 py-0.5 rounded-full bg-dark-50 text-[10px] text-dark-600">
                        {w.word} <span className="text-verite-600 font-bold">×{w.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* ═══ FLAGS ═══ */}
        {tab === "flags" && (
          <>
            {analysis.redFlags.length > 0 ? (
              <>
                <h2 className="text-sm font-bold text-accent-coral">🚩 Red Flags ({analysis.redFlags.length})</h2>
                {analysis.redFlags.map((f) => (
                  <div key={f.id} className={`glass-card p-3 border-l-[3px] ${
                    f.severity === "critical" ? "border-red-500" :
                    f.severity === "high" ? "border-accent-coral" :
                    f.severity === "medium" ? "border-accent-orange" : "border-accent-sky"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>{f.icon}</span>
                      <span className="font-bold text-sm flex-1">{f.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        f.severity === "critical" ? "bg-red-500/20 text-red-400" :
                        f.severity === "high" ? "bg-accent-coral/20 text-accent-coral" :
                        f.severity === "medium" ? "bg-accent-orange/20 text-accent-orange" : "bg-accent-sky/20 text-accent-sky"
                      }`}>{f.severity === "critical" ? "Critique" : f.severity === "high" ? "Élevé" : f.severity === "medium" ? "Moyen" : "Faible"}</span>
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">{f.description}</p>
                    <div className="mt-1.5 h-1 bg-dark-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${f.score > 75 ? "bg-red-500" : f.score > 50 ? "bg-accent-coral" : "bg-accent-orange"}`}
                        style={{ width: `${f.score}%` }} />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl">✅</span>
                <p className="font-bold text-accent-cyan mt-2">Aucun red flag !</p>
                <p className="text-[11px] text-dark-400">Conversation saine</p>
              </div>
            )}

            {analysis.greenFlags.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-accent-cyan mt-2">💚 Signaux positifs ({analysis.greenFlags.length})</h2>
                {analysis.greenFlags.map((f) => (
                  <div key={f.id} className="glass-card p-3 border-l-[3px] border-accent-cyan">
                    <div className="flex items-center gap-2">
                      <span>{f.icon}</span>
                      <span className="font-bold text-sm">{f.title}</span>
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">{f.description}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ═══ DEEP DIVE ═══ */}
        {tab === "deep" && (
          <>
            <h2 className="text-base font-bold">🔬 Analyse approfondie</h2>

            <div className="glass-card p-4">
              <h3 className="section-title">⏱️ Temps de réponse</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-dark-500">Toi</p>
                  <p className="text-xl font-black text-verite-600">{you.avgResponseTimeMin}<span className="text-[10px]">min</span></p>
                  <p className="text-[9px] text-dark-500">⚡{you.fastestResponseMin}m 🐢{you.slowestResponseMin}m</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-dark-500">{other.name}</p>
                  <p className="text-xl font-black text-accent-cyan">{other.avgResponseTimeMin}<span className="text-[10px]">min</span></p>
                  <p className="text-[9px] text-dark-500">⚡{other.fastestResponseMin}m 🐢{other.slowestResponseMin}m</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="section-title">🌅 Qui lance / termine</h3>
              <Bar label="Premier msg" a={you.initiations} b={other.initiations} nameA="Toi" nameB={other.name} />
              <Bar label="Dernier msg" a={you.lastMessageOfDay} b={other.lastMessageOfDay} nameA="Toi" nameB={other.name} />
            </div>

            {analysis.conversationGaps.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="section-title">😶 Silences</h3>
                {analysis.conversationGaps.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex items-center justify-between bg-dark-50 px-3 py-1.5 rounded-lg mb-1 text-[11px]">
                    <span className="text-dark-400">{g.start.toLocaleDateString("fr-FR")} → {g.end.toLocaleDateString("fr-FR")}</span>
                    <span className="font-bold text-accent-orange">{g.durationHours > 48 ? `${Math.round(g.durationHours / 24)}j` : `${g.durationHours}h`}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="glass-card p-4">
              <h3 className="section-title">💡 Engagement</h3>
              <div className="space-y-2">
                {[
                  { q: "Ratio messages", a: analysis.messageRatio.toFixed(2), ok: analysis.messageRatio > 0.6 && analysis.messageRatio < 1.5 },
                  { q: `${gLabel} pose des questions ?`, a: other.totalQuestions > you.totalQuestions * 0.5 ? "Oui ✅" : "Non ❌", ok: other.totalQuestions > you.totalQuestions * 0.5 },
                  { q: `${gLabel} envoie des médias ?`, a: other.totalMedia > 3 ? "Oui ✅" : "Non ❌", ok: other.totalMedia > 3 },
                  { q: "Convo équilibrée ?", a: analysis.messageRatio > 0.6 && analysis.messageRatio < 1.5 ? "Oui ✅" : "Non ❌", ok: analysis.messageRatio > 0.6 && analysis.messageRatio < 1.5 },
                  { q: `${gLabel} ghost ?`, a: other.ghostCount < 3 ? "Rarement ✅" : `${other.ghostCount}x ❌`, ok: other.ghostCount < 3 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-dark-400">{item.q}</span>
                    <span className={`font-bold ${item.ok ? "text-accent-cyan" : "text-accent-coral"}`}>{item.a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="section-title">📆 Timeline</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-dark-400">Premier msg</span><span>{analysis.firstMessage.toLocaleDateString("fr-FR")}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Dernier msg</span><span>{analysis.lastMessage.toLocaleDateString("fr-FR")}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Durée</span><span className="font-bold">{analysis.totalDays}j</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Série actuelle</span><span>{analysis.currentStreak}j</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Jour pic</span><span>{DAY_NAMES[analysis.peakDay]}</span></div>
              </div>
            </div>
          </>
        )}

        {/* ═══ TIMELINE TAB ═══ */}
        {tab === "timeline" && (
          <>
            <h2 className="text-base font-bold">📅 Chronologie</h2>

            {/* Milestones */}
            {milestones.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="section-title">🏆 Jalons</h3>
                <div className="relative pl-6 border-l-2 border-verite-200 space-y-4">
                  {milestones.map((m, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-verite-500 flex items-center justify-center">
                        <span className="text-[8px]">{m.emoji}</span>
                      </div>
                      <p className="text-xs font-bold text-dark-700">{m.emoji} {m.title}</p>
                      <p className="text-[10px] text-dark-500">{m.description}</p>
                      <p className="text-[9px] text-dark-400 mt-0.5">{m.date.toLocaleDateString("fr-FR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Temporal patterns */}
            {patterns.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="section-title">🔍 Patterns détectés</h3>
                <div className="space-y-2">
                  {patterns.map((p) => (
                    <div key={p.id} className={`px-3 py-2.5 rounded-xl border-l-[3px] ${
                      p.type === "positive" ? "border-accent-cyan bg-accent-cyan/5" :
                      p.type === "negative" ? "border-accent-coral bg-accent-coral/5" :
                      "border-dark-200 bg-dark-50"
                    }`}>
                      <p className="text-xs font-bold text-dark-700">{p.emoji} {p.title}</p>
                      <p className="text-[10px] text-dark-500 mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notable messages */}
            {notableMessages.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="section-title">💬 Messages marquants</h3>
                <div className="space-y-2.5">
                  {notableMessages.map((m, i) => (
                    <div key={i} className="bg-dark-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-verite-100 text-verite-600 font-bold">
                          {m.label}
                        </span>
                        <span className="text-[9px] text-dark-400">{m.date.toLocaleDateString("fr-FR")}</span>
                      </div>
                      <p className="text-[11px] text-dark-600 italic">"{m.text}"</p>
                      <p className="text-[9px] text-dark-400 mt-1">— {m.sender}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patterns.length === 0 && milestones.length === 0 && notableMessages.length === 0 && (
              <div className="glass-card p-8 text-center">
                <span className="text-4xl">📅</span>
                <p className="text-dark-500 text-sm mt-2">Pas assez de données pour la timeline</p>
              </div>
            )}
          </>
        )}

        {/* ═══ CONSEILS TAB ═══ */}
        {tab === "conseils" && (
          <>
            <h2 className="text-base font-bold">💡 Conseils personnalisés</h2>

            {advices.length > 0 ? (
              <div className="space-y-2.5">
                {advices.map((a, i) => (
                  <div key={i} className={`glass-card p-4 border-l-[3px] ${
                    a.type === "warning" ? "border-red-400" :
                    a.type === "tip" ? "border-verite-500" :
                    "border-accent-cyan"
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl flex-shrink-0">{a.emoji}</span>
                      <div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          a.type === "warning" ? "bg-red-100 text-red-600" :
                          a.type === "tip" ? "bg-verite-100 text-verite-600" :
                          "bg-accent-cyan/20 text-accent-cyan"
                        }`}>
                          {a.type === "warning" ? "Attention" : a.type === "tip" ? "Conseil" : "Positif"}
                        </span>
                        <p className="text-[11px] text-dark-600 mt-1.5 leading-relaxed">{a.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <span className="text-4xl">✅</span>
                <p className="text-dark-500 text-sm mt-2">Rien de spécial à signaler. Continue comme ça !</p>
              </div>
            )}

            {/* General tips based on relation type */}
            <div className="glass-card p-4 mt-2" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(247,37,133,0.04))" }}>
              <h3 className="text-xs font-bold text-dark-700 mb-2">📌 Règle d'or</h3>
              <p className="text-[11px] text-dark-600 leading-relaxed">
                {analysis.relationType === "crush"
                  ? "Avec un crush, observe plus que tu n'agis. Si tu dois te convaincre que la personne s'intéresse à toi, c'est qu'elle ne s'intéresse probablement pas."
                  : analysis.relationType === "ex"
                  ? "Avec un(e) ex, le silence est ta meilleure arme. Chaque message que tu envoies renforce son ego et diminue le tien."
                  : analysis.relationType === "partner"
                  ? "Dans un couple, la communication est la clé. Mais attention : communiquer ce n'est pas juste parler, c'est écouter."
                  : "Observe l'effort. Si tu dois te battre pour avoir de l'attention, ce n'est pas de l'amour, c'est du travail."
                }
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#0b0b14]/95">
        <button onClick={onReset}
          className="btn-primary w-full max-w-sm mx-auto block py-3 text-sm active:scale-[0.97]">
          🔄 Nouvelle analyse
        </button>
      </div>
    </div>
  );
}
