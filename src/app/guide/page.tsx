import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérité — Comment savoir si mon crush m'aime ? Analyse WhatsApp",
  description:
    "Analyse tes conversations WhatsApp pour détecter les red flags, calculer les scores d'intérêt et découvrir la vérité sur ta relation. Gratuit et confidentiel.",
  keywords: [
    "analyse WhatsApp",
    "red flags relation",
    "crush m'aime",
    "analyseur conversation",
    "détecter manipulation",
    "ghosting",
    "toxicité couple",
    "score compatibilité",
  ],
};

export default function GuidePage() {
  return (
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-4xl font-black gradient-text mb-8 text-center">
        Comment savoir si ton crush s'intéresse à toi ?
      </h1>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-dark-800 mb-3">🔍 Qu'est-ce que Vérité ?</h2>
        <p className="text-dark-600 text-sm leading-relaxed">
          Vérité est un analyseur de conversations WhatsApp qui détecte automatiquement les <strong>red flags</strong>,
          calcule les <strong>scores d'intérêt</strong>, et te donne un verdict honnête sur ta relation.
          Que ce soit avec ton crush, ton ex, ton/ta partenaire ou un(e) ami(e), Vérité analyse tout :
          temps de réponse, effort, patterns toxiques, et bien plus.
        </p>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-dark-800 mb-3">🚩 Les Red Flags que Vérité détecte</h2>
        <ul className="space-y-2 text-sm text-dark-600">
          <li className="flex gap-2"><span>👻</span><span><strong>Disparitions fréquentes</strong> — Disparaît sans prévenir puis revient comme si de rien n'était</span></li>
          <li className="flex gap-2"><span>⏰</span><span><strong>Temps de réponse asymétrique</strong> — Tu réponds en 5min, il/elle répond en 3h</span></li>
          <li className="flex gap-2"><span>📱</span><span><strong>Relances excessives</strong> — Tu envoies 3 messages avant d'avoir une réponse</span></li>
          <li className="flex gap-2"><span>🌙</span><span><strong>Messages nocturnes uniquement</strong> — Il/elle ne t'écrit que la nuit</span></li>
          <li className="flex gap-2"><span>🍞</span><span><strong>Miettes d'attention</strong> — Assez d'affection pour te garder en option, pas plus</span></li>
          <li className="flex gap-2"><span>📉</span><span><strong>Perte d'intérêt</strong> — Les messages diminuent progressivement</span></li>
        </ul>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-dark-800 mb-3">📊 Ce que Vérité analyse</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { emoji: "⚖️", title: "Score d'effort", desc: "Qui fait le plus d'efforts ?" },
            { emoji: "💕", title: "Compatibilité", desc: "Êtes-vous sur la même longueur d'onde ?" },
            { emoji: "🧪", title: "Score d'intérêt", desc: "Est-il/elle vraiment intéressé(e) ?" },
            { emoji: "☠️", title: "Toxicité", desc: "Y a-t-il des patterns toxiques ?" },
            { emoji: "📅", title: "Patterns temporels", desc: "Quand vous parlez-vous le plus ?" },
            { emoji: "💡", title: "Conseils", desc: "Des recommandations personnalisées" },
          ].map((item) => (
            <div key={item.title} className="bg-dark-50 rounded-xl p-3">
              <span className="text-xl">{item.emoji}</span>
              <p className="font-bold text-dark-700 text-xs mt-1">{item.title}</p>
              <p className="text-dark-500 text-[10px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-dark-800 mb-3">🔒 Confidentialité</h2>
        <p className="text-dark-600 text-sm leading-relaxed">
          <strong>Tes données restent sur ton téléphone.</strong> Vérité analyse tout localement dans ton navigateur.
          Aucun message n'est envoyé à un serveur. Aucun compte nécessaire. 100% gratuit et privé.
        </p>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-dark-800 mb-3">📱 Comment exporter une discussion WhatsApp</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-sm text-dark-700 mb-2"> iPhone</h3>
            <ol className="space-y-1 text-sm text-dark-600 list-decimal list-inside">
              <li>Ouvre la conversation WhatsApp</li>
              <li>Appuie sur le nom du contact (en haut)</li>
              <li>Défile vers le bas → "Exporter la discussion"</li>
              <li>Choisis "Sans médias"</li>
              <li>Appuie "Enregistrer dans Fichiers"</li>
              <li>Reviens sur Vérité et uploade le fichier</li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold text-sm text-dark-700 mb-2">🤖 Android</h3>
            <ol className="space-y-1 text-sm text-dark-600 list-decimal list-inside">
              <li>Ouvre la conversation WhatsApp</li>
              <li>Appuie sur ⋮ (3 points) → Plus → Exporter</li>
              <li>Choisis "Sans médias"</li>
              <li>Partage vers "Mes fichiers" ou "Enregistrer"</li>
              <li>Reviens sur Vérité et uploade le fichier</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <a href="/"
          className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-bold">
          🔍 Analyser ma conversation
        </a>
        <p className="text-dark-400 text-xs mt-4">Powered by <strong>Haniel_dev</strong></p>
      </div>
    </div>
  );
}
