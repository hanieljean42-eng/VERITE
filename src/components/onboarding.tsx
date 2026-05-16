"use client";

import { useState } from "react";

const SLIDES = [
  {
    emoji: "🔍",
    title: "Analyse tes conversations",
    description: "Importe un export WhatsApp et découvre la vérité sur ta relation",
    bg: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  },
  {
    emoji: "🚩",
    title: "Détecte les red flags",
    description: "Red flags, signaux positifs, score de toxicité... tout est analysé",
    bg: "linear-gradient(135deg, #f72585, #fb7aaf)",
  },
  {
    emoji: "📊",
    title: "Stats détaillées",
    description: "Temps de réponse, effort, compatibilité, patterns temporels et plus",
    bg: "linear-gradient(135deg, #06d6a0, #34d399)",
  },
];

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      localStorage.setItem("verite-onboarded", "true");
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("verite-onboarded", "true");
    onComplete();
  };

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm text-center">
        {/* Slide content */}
        <div className="animate-fade-in-up" key={slide}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float"
            style={{ background: current.bg }}
          >
            <span className="text-5xl">{current.emoji}</span>
          </div>
          <h1 className="text-3xl font-black text-dark-800 dark:text-white mb-3">
            {current.title}
          </h1>
          <p className="text-dark-500 dark:text-dark-400 text-base leading-relaxed px-4">
            {current.description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-10 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 24 : 8,
                background: i === slide
                  ? "linear-gradient(90deg, #8b5cf6, #f72585)"
                  : "#d1d5db",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleNext}
          className="btn-primary w-full py-4 text-base font-bold mb-3"
        >
          {slide < SLIDES.length - 1 ? "Suivant →" : "C'est parti ! 🚀"}
        </button>
        {slide < SLIDES.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-dark-400 text-sm font-medium"
          >
            Passer
          </button>
        )}
      </div>
    </div>
  );
}
