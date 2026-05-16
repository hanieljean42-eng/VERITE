"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import JSZip from "jszip";

interface Props {
  onFileLoaded: (content: string) => void;
  onCompare?: () => void;
}

export default function UploadScreen({ onFileLoaded, onCompare }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<"iphone" | "android">("iphone");

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    setIsIOS(ios);
    setIsSafari(safari);
    // Auto-select guide tab based on device
    if (ios) setGuideTab("iphone");

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  };

  const readFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const isZip = file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";

        if (isZip) {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          let txtContent: string | null = null;
          const zipFiles = Object.entries(zip.files).filter(([, e]) => !e.dir);

          for (const [filename, zipEntry] of zipFiles) {
            if (filename.endsWith(".txt") || filename.includes("WhatsApp") || filename.includes("chat")) {
              const bytes = await zipEntry.async("uint8array");
              txtContent = new TextDecoder("utf-8").decode(bytes);
              break;
            }
          }
          if (!txtContent) {
            for (const [filename, zipEntry] of zipFiles) {
              if (!filename.endsWith(".jpg") && !filename.endsWith(".png") && !filename.endsWith(".opus") && !filename.endsWith(".mp4")) {
                const bytes = await zipEntry.async("uint8array");
                txtContent = new TextDecoder("utf-8").decode(bytes);
                break;
              }
            }
          }
          setLoading(false);
          if (txtContent) {
            onFileLoaded(txtContent);
          } else {
            alert("Aucun fichier texte trouvé dans le ZIP. Fichiers trouvés : " + zipFiles.map(([n]) => n).join(", "));
          }
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            setLoading(false);
            onFileLoaded(text);
          };
          reader.onerror = () => {
            setLoading(false);
            alert("Erreur de lecture du fichier.");
          };
          reader.readAsText(file, "utf-8");
        }
      } catch (err) {
        setLoading(false);
        alert("Erreur de lecture du fichier. Vérifie que c'est un export WhatsApp valide.");
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  const iphoneSteps = [
    { emoji: "💬", text: "Ouvre la conversation WhatsApp" },
    { emoji: "👤", text: "Appuie sur le nom du contact (en haut)" },
    { emoji: "⬇️", text: "Défile vers le bas → \"Exporter la discussion\"" },
    { emoji: "📎", text: "Choisis \"Sans médias\"" },
    { emoji: "💾", text: "Appuie \"Enregistrer dans Fichiers\"" },
    { emoji: "📁", text: "Choisis un dossier (ex: \"Sur mon iPhone\")" },
    { emoji: "🌐", text: "Reviens ici et appuie \"Choisir un fichier\"" },
    { emoji: "✅", text: "Sélectionne le .zip que tu viens d'enregistrer" },
  ];

  const androidSteps = [
    { emoji: "💬", text: "Ouvre la conversation WhatsApp" },
    { emoji: "⋮", text: "Appuie sur ⋮ (3 points en haut à droite)" },
    { emoji: "📤", text: "Plus → Exporter la discussion" },
    { emoji: "📎", text: "Choisis \"Sans médias\"" },
    { emoji: "💾", text: "Partage vers \"Mes fichiers\" ou \"Enregistrer\"" },
    { emoji: "🌐", text: "Reviens ici et appuie \"Choisir un fichier\"" },
    { emoji: "✅", text: "Sélectionne le .zip dans Téléchargements" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8">
      {/* Logo animé */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 animate-float animate-pulse-glow"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #f72585, #ffa62b)" }}>
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-5xl font-black gradient-text mb-3 tracking-tight">Vérité</h1>
        <p className="text-dark-500 text-base px-6 leading-relaxed">
          Découvre la <strong className="text-dark-700">vérité</strong> derrière tes conversations WhatsApp
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="badge-purple">🚩 Red flags</span>
          <span className="badge-blue">📊 Stats</span>
          <span className="badge-green">✨ Aperçus</span>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`w-full max-w-sm rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          dragging ? "scale-[1.03] shadow-2xl" : "active:scale-[0.97] shadow-xl"
        }`}
        style={{
          background: dragging
            ? "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(247,37,133,0.1))"
            : "linear-gradient(135deg, #ffffff, #f5f3ff, #fdf2f8)",
          border: dragging ? "2px dashed #8b5cf6" : "2px dashed #d1d5db",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={handleChange} />

        {loading ? (
          <div className="py-8">
            <div className="w-10 h-10 border-[3px] border-t-verite-500 border-r-accent-pink border-b-accent-orange border-l-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-600 text-sm font-medium">Lecture en cours...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)" }}>
              <span className="text-3xl">📂</span>
            </div>
            <h2 className="text-xl font-extrabold mb-1 text-dark-800">Importe ton chat</h2>
            <p className="text-dark-400 text-sm mb-5">
              Fichier <strong>.txt</strong> ou <strong>.zip</strong> — export WhatsApp
            </p>
            <div className="btn-primary inline-flex items-center gap-2 px-7 py-3 text-sm">
              📤 Choisir un fichier
            </div>
          </>
        )}
      </div>

      {/* Compare button */}
      {onCompare && (
        <button
          onClick={onCompare}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.96]"
          style={{
            background: "linear-gradient(135deg, rgba(6,214,160,0.1), rgba(52,211,153,0.06))",
            border: "1px solid rgba(6,214,160,0.3)",
            color: "#06d6a0",
          }}
        >
          <span className="text-lg">⚔️</span>
          Comparer 2 conversations
        </button>
      )}

      {/* Guide button */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.96]"
        style={{
          background: showGuide
            ? "linear-gradient(135deg, #8b5cf6, #f72585)"
            : "linear-gradient(135deg, #f5f3ff, #fdf2f8)",
          color: showGuide ? "#fff" : "#6b7280",
          border: showGuide ? "none" : "1px solid #e5e7eb",
        }}
      >
        <span className="text-lg">{showGuide ? "✕" : "❓"}</span>
        {showGuide ? "Fermer le guide" : "Comment exporter ma discussion ?"}
      </button>

      {/* Guide détaillé */}
      {showGuide && (
        <div className="mt-4 w-full max-w-sm animate-fade-in-up">
          {/* Tab selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setGuideTab("iphone")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                guideTab === "iphone" ? "text-white shadow-lg" : "bg-white text-dark-500 border border-dark-100"
              }`}
              style={guideTab === "iphone" ? { background: "linear-gradient(135deg, #1a1a2e, #16213e)" } : {}}
            >
              <span className="text-lg"></span> iPhone
            </button>
            <button
              onClick={() => setGuideTab("android")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                guideTab === "android" ? "text-white shadow-lg" : "bg-white text-dark-500 border border-dark-100"
              }`}
              style={guideTab === "android" ? { background: "linear-gradient(135deg, #0f9d58, #34a853)" } : {}}
            >
              <span className="text-lg">🤖</span> Android
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {(guideTab === "iphone" ? iphoneSteps : androidSteps).map((step, i) => (
              <div key={i} className="flex items-start gap-3 glass-card px-4 py-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: `hsl(${(i * 45) % 360}, 70%, 55%)` }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-dark-700 text-sm font-medium">{step.emoji} {step.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Important tips */}
          <div className="mt-4 glass-card p-4" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(255,166,43,0.05))" }}>
            <p className="text-xs font-bold text-dark-700 mb-2">⚠️ Points importants :</p>
            <ul className="space-y-1.5 text-[11px] text-dark-600">
              <li className="flex gap-2"><span>•</span><span>Choisis toujours <strong>"Sans médias"</strong> pour un fichier plus léger</span></li>
              <li className="flex gap-2"><span>•</span><span>Le fichier doit être un <strong>.zip</strong> ou <strong>.txt</strong></span></li>
              {guideTab === "iphone" && (
                <>
                  <li className="flex gap-2"><span>•</span><span>Sur iPhone, choisis <strong>"Enregistrer dans Fichiers"</strong> (pas Mail !)</span></li>
                  <li className="flex gap-2"><span>•</span><span>Si tu ne vois pas cette option, défile à droite dans la liste</span></li>
                </>
              )}
              {guideTab === "android" && (
                <li className="flex gap-2"><span>•</span><span>Le fichier est souvent dans le dossier <strong>Téléchargements</strong></span></li>
              )}
              <li className="flex gap-2"><span>•</span><span>Tes données restent sur ton téléphone, <strong>rien n'est envoyé</strong></span></li>
            </ul>
          </div>

          {/* Alternative rapide */}
          <div className="mt-3 glass-card p-4" style={{ background: "linear-gradient(135deg, rgba(6,214,160,0.08), rgba(52,211,153,0.05))" }}>
            <p className="text-xs font-bold text-dark-700 mb-2">💡 Astuce rapide :</p>
            <p className="text-[11px] text-dark-600 leading-relaxed">
              {guideTab === "iphone"
                ? "Tu peux aussi partager le fichier vers \"Notes\" ou te l'envoyer sur WhatsApp (à toi-même), puis le télécharger et l'uploader ici."
                : "Tu peux aussi partager vers Telegram ou WhatsApp (à toi-même), puis télécharger le fichier et l'uploader ici."
              }
            </p>
          </div>
        </div>
      )}

      {/* Install PWA banner */}
      {!isInstalled && (
        <div className="mt-6 w-full max-w-sm glass-card p-4 text-center"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(247,37,133,0.06))" }}>
          <p className="text-sm font-bold text-dark-700 mb-1">📲 Installe l'app !</p>
          <p className="text-xs text-dark-500 mb-3">Pour un accès rapide depuis ton écran d'accueil</p>
          {installPrompt ? (
            <button onClick={handleInstall}
              className="btn-primary px-6 py-2 text-sm">
              Installer Vérité
            </button>
          ) : isIOS || isSafari ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-dark-600">
                <span className="text-lg">⤴️</span>
                <span>Appuie sur <strong className="text-dark-800">Partager</strong> (icône en bas)</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-dark-600">
                <span className="text-lg">➕</span>
                <span>Puis <strong className="text-dark-800">Sur l'écran d'accueil</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-dark-400">
              Sur Chrome : <strong>⋮ Menu → Installer l'application</strong>
            </p>
          )}
        </div>
      )}

      {/* Notification permission */}
      <NotificationBanner />

      {/* History */}
      <HistorySection />

      {/* Guide link */}
      <a href="/guide" className="mt-6 flex items-center gap-2 text-xs text-dark-400 hover:text-verite-500 transition-colors">
        📖 Guide complet d'utilisation
      </a>

      {/* Footer - Powered by */}
      <div className="mt-8 mb-4 text-center">
        <p className="text-[11px] text-dark-400">
          Powered by <strong className="text-dark-600">Haniel_dev</strong>
        </p>
      </div>
    </div>
  );
}

function HistorySection() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("verite-history") || "[]");
      setHistory(h);
    } catch (e) { /* ignore */ }
  }, []);

  const deleteItem = (id: number) => {
    const updated = history.filter((h: any) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("verite-history", JSON.stringify(updated));
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem("verite-history");
  };

  if (history.length === 0) return null;

  return (
    <div className="mt-6 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-dark-400 uppercase tracking-widest">
          📋 Analyses précédentes
        </p>
        <button
          onClick={clearAll}
          className="text-[10px] text-accent-coral font-bold hover:underline"
        >
          Tout supprimer
        </button>
      </div>
      <div className="space-y-2">
        {history.map((h: any) => (
          <div key={h.id} className="glass-card px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{h.verdictEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark-700 truncate">{h.otherName}</p>
              <div className="flex items-center gap-2 text-[10px] text-dark-500">
                <span>Score: <strong>{h.globalScore}/100</strong></span>
                <span>•</span>
                <span>{h.totalMessages} msgs</span>
                <span>•</span>
                <span>🚩{h.redFlags} 💚{h.greenFlags}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] text-dark-400">
                {new Date(h.date).toLocaleDateString("fr-FR")}
              </span>
              <button
                onClick={() => deleteItem(h.id)}
                className="text-[10px] text-accent-coral/70 hover:text-accent-coral font-bold transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationBanner() {
  const [permission, setPermission] = useState<string>("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    if (localStorage.getItem("verite-notif-dismissed")) {
      setDismissed(true);
    }
  }, []);

  const handleAllow = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        new Notification("Vérité", {
          body: "Notifications activées ! Tu seras prévenu(e) des mises à jour.",
          icon: "/icons/icon-192.svg",
        });
      }
    } catch (e) { /* ignore */ }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("verite-notif-dismissed", "true");
  };

  if (permission !== "default" || dismissed || !("Notification" in (typeof window !== "undefined" ? window : {}))) return null;

  return (
    <div className="mt-6 w-full max-w-sm glass-card p-4 text-center"
      style={{ background: "linear-gradient(135deg, rgba(6,214,160,0.08), rgba(52,211,153,0.05))" }}>
      <p className="text-sm font-bold text-dark-700 mb-1">🔔 Reste informé(e)</p>
      <p className="text-xs text-dark-500 mb-3">Active les notifications pour ne rien rater</p>
      <div className="flex gap-2 justify-center">
        <button onClick={handleAllow}
          className="px-5 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #06d6a0, #34d399)" }}>
          Activer
        </button>
        <button onClick={handleDismiss}
          className="px-5 py-2 rounded-xl text-xs font-bold text-dark-500 bg-dark-50">
          Plus tard
        </button>
      </div>
    </div>
  );
}
