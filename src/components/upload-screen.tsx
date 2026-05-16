"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import JSZip from "jszip";

interface Props {
  onFileLoaded: (content: string) => void;
}

export default function UploadScreen({ onFileLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
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
          // Find the .txt file inside the zip
          let txtContent: string | null = null;
          for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir && (filename.endsWith(".txt") || filename.includes("WhatsApp"))) {
              txtContent = await zipEntry.async("string");
              break;
            }
          }
          // If no .txt found, try the first file
          if (!txtContent) {
            const files = Object.values(zip.files).filter(f => !f.dir);
            if (files.length > 0) {
              txtContent = await files[0].async("string");
            }
          }
          setLoading(false);
          if (txtContent) {
            onFileLoaded(txtContent);
          } else {
            alert("Aucun fichier texte trouvé dans le ZIP.");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      {/* Logo animé */}
      <div className="text-center mb-10">
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
          <span className="badge-green">✨ Insights</span>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`w-full max-w-sm rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          dragging
            ? "scale-[1.03] shadow-2xl"
            : "active:scale-[0.97] shadow-xl"
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
        <input ref={fileRef} type="file" accept=".txt,.zip" className="hidden" onChange={handleChange} />

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

      {/* Install PWA banner */}
      {!isInstalled && (
        <div className="mt-8 w-full max-w-sm glass-card p-4 text-center"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(247,37,133,0.06))" }}>
          <p className="text-sm font-bold text-dark-700 mb-1">📲 Installe l'app !</p>
          <p className="text-xs text-dark-500 mb-3">Pour recevoir directement les fichiers depuis WhatsApp</p>
          {installPrompt ? (
            <button onClick={handleInstall}
              className="btn-primary px-6 py-2 text-sm">
              Installer Vérité
            </button>
          ) : (
            <p className="text-[11px] text-dark-400">
              Sur Chrome : <strong>⋮ Menu → Installer l'application</strong><br/>
              Sur Safari : <strong>Partager → Sur l'écran d'accueil</strong>
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 w-full max-w-sm">
        <p className="text-[11px] font-bold text-dark-400 uppercase tracking-widest mb-4 text-center">
          💡 Comment exporter
        </p>
        <div className="space-y-2.5">
          {[
            { n: "1", t: "Ouvre la conversation WhatsApp", bg: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
            { n: "2", t: "⋮ Menu → Plus → Exporter la discussion", bg: "linear-gradient(135deg, #f72585, #fb7aaf)" },
            { n: "3", t: "Choisis \"Sans médias\"", bg: "linear-gradient(135deg, #ffa62b, #fbbf24)" },
            { n: "4", t: "Envoie-toi le fichier et importe-le ici", bg: "linear-gradient(135deg, #06d6a0, #34d399)" },
          ].map((item) => (
            <div key={item.n} className="flex items-center gap-3 glass-card px-4 py-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: item.bg }}>
                {item.n}
              </div>
              <p className="text-dark-600 text-sm flex-1">{item.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
