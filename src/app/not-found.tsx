import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl mb-4">🔍</div>
      <h1 className="text-3xl font-black gradient-text mb-3">Page introuvable</h1>
      <p className="text-dark-500 text-sm mb-8 max-w-xs">
        Cette page n'existe pas. Retourne analyser tes conversations.
      </p>
      <Link
        href="/"
        className="btn-primary px-8 py-3 text-sm inline-block"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
