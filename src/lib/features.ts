import { PersonStats, Gender, ChatAnalysis } from "./analyzer";

export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "disorganized";
export type TexterType = "novelist" | "ghost" | "emoji-addict" | "interrogator" | "dry-texter" | "balanced";
export type ConversationMomentum = "rising" | "stable" | "declining" | "dead";

export interface AttachmentResult {
  style: AttachmentStyle;
  title: string;
  description: string;
  emoji: string;
  traits: string[];
  score: number;
}

export interface TexterTypeResult {
  type: TexterType;
  title: string;
  description: string;
  emoji: string;
  traits: string[];
}

export interface ToxicityBreakdown {
  overall: number;
  manipulation: number;
  loveBombing: number;
  ghosting: number;
  breadcrumbing: number;
  oneWayEffort: number;
  description: string;
}

export interface InvestmentScore {
  you: number;
  other: number;
  winner: "you" | "other" | "equal";
  description: string;
}

export interface MomentumResult {
  direction: ConversationMomentum;
  emoji: string;
  description: string;
  recentVsOld: number;
}

export interface VocabularyAnalysis {
  you: { richness: number; uniqueWords: number; avgWordLength: number };
  other: { richness: number; uniqueWords: number; avgWordLength: number };
}

export interface FeatureResults {
  attachment: AttachmentResult;
  texterType: TexterTypeResult;
  otherTexterType: TexterTypeResult;
  toxicity: ToxicityBreakdown;
  investment: InvestmentScore;
  momentum: MomentumResult;
  vocabulary: VocabularyAnalysis;
  ickScore: number;
  ickReasons: string[];
  compatibilityDetails: { category: string; score: number; emoji: string }[];
}

export function detectAttachmentStyle(
  you: PersonStats,
  other: PersonStats,
  analysis: ChatAnalysis
): AttachmentResult {
  let anxiousScore = 0;
  let avoidantScore = 0;
  let secureScore = 0;

  // Anxious indicators for "other"
  if (other.doubleTexts + other.tripleTexts > 15) anxiousScore += 20;
  if (other.initiations > you.initiations * 1.5) anxiousScore += 15;
  if (other.avgResponseTimeMin < 5) anxiousScore += 15;
  if (other.loveCount > you.loveCount * 2) anxiousScore += 10;
  if (other.totalQuestions > you.totalQuestions * 1.5) anxiousScore += 10;

  // Avoidant indicators for "other"
  if (other.avgResponseTimeMin > 120) avoidantScore += 20;
  if (other.ghostCount > 5) avoidantScore += 20;
  if (other.avgWordsPerMessage < 4) avoidantScore += 15;
  if (other.initiations < you.initiations * 0.3) avoidantScore += 15;
  if (other.totalEmojis < you.totalEmojis * 0.2) avoidantScore += 10;

  // Secure indicators
  if (analysis.messageRatio > 0.7 && analysis.messageRatio < 1.4) secureScore += 20;
  if (Math.abs(other.avgResponseTimeMin - you.avgResponseTimeMin) < 20) secureScore += 15;
  if (other.initiations > you.initiations * 0.6) secureScore += 15;
  if (other.totalQuestions > 10 && you.totalQuestions > 10) secureScore += 10;
  if (other.laughCount > 5 && other.loveCount > 3) secureScore += 10;

  const maxScore = Math.max(anxiousScore, avoidantScore, secureScore);

  if (maxScore === secureScore && secureScore > 30) {
    return {
      style: "secure",
      title: "Attachement Sécure",
      description: "Cette personne semble à l'aise dans la relation, ni trop collante ni trop distante.",
      emoji: "🛡️",
      traits: ["Réponses régulières", "Initiative partagée", "Communication ouverte", "Emotions exprimées"],
      score: secureScore,
    };
  }
  if (maxScore === anxiousScore && anxiousScore > avoidantScore) {
    return {
      style: "anxious",
      title: "Attachement Anxieux",
      description: "Cette personne montre des signes d'anxiété relationnelle : relances fréquentes, besoin de validation.",
      emoji: "💫",
      traits: ["Relances fréquentes", "Réponses très rapides", "Beaucoup d'affection", "Initie souvent"],
      score: anxiousScore,
    };
  }
  if (avoidantScore > 20) {
    return {
      style: "avoidant",
      title: "Attachement Évitant",
      description: "Cette personne garde ses distances : réponses lentes, peu d'initiative, messages courts.",
      emoji: "🏃",
      traits: ["Réponses lentes", "Messages courts", "Peu d'initiative", "Disparitions fréquentes"],
      score: avoidantScore,
    };
  }
  return {
    style: "disorganized",
    title: "Attachement Désorganisé",
    description: "Comportement imprévisible : parfois très présent(e), parfois absent(e).",
    emoji: "🎭",
    traits: ["Imprévisible", "Chaud & Froid", "Schémas incohérents", "Signaux mixtes"],
    score: Math.max(anxiousScore, avoidantScore) * 0.7,
  };
}

export function detectTexterType(stats: PersonStats): TexterTypeResult {
  if (stats.avgWordsPerMessage > 15) {
    return {
      type: "novelist",
      title: "Le Romancier",
      description: "Écrit des pavés, détaille tout, ne laisse rien au hasard.",
      emoji: "📚",
      traits: ["Messages longs", "Expressif", "Détaillé", "Conteur"],
    };
  }
  if (stats.avgWordsPerMessage < 3 && stats.totalEmojis < 5) {
    return {
      type: "dry-texter",
      title: "Le Sécheur",
      description: "Réponses sèches, minimum syndical. 'Ok', 'Ouais', 'Mdr'.",
      emoji: "🏜️",
      traits: ["Ultra court", "Peu expressif", "Effort minimum", "Froid"],
    };
  }
  if (stats.ghostCount > 8) {
    return {
      type: "ghost",
      title: "Le Fantôme",
      description: "Disparaît pendant des jours, puis réapparaît comme si de rien n'était.",
      emoji: "👻",
      traits: ["Disparaît souvent", "Imprévisible", "Intermittent", "Mystérieux"],
    };
  }
  if (stats.avgEmojisPerMessage > 2) {
    return {
      type: "emoji-addict",
      title: "L'Accro aux Emojis",
      description: "Un message sans emoji ? Impossible. Chaque phrase a son lot de smileys.",
      emoji: "🤩",
      traits: ["Emoji partout", "Expressif visuellement", "Amusant", "Coloré"],
    };
  }
  if (stats.totalQuestions > stats.totalMessages * 0.3) {
    return {
      type: "interrogator",
      title: "L'Interrogateur",
      description: "Pose beaucoup de questions, veut tout savoir. Curieux ou contrôlant ?",
      emoji: "🔍",
      traits: ["Curieux", "Beaucoup de questions", "Intéressé", "Enquêteur"],
    };
  }
  return {
    type: "balanced",
    title: "L'Équilibré",
    description: "Ni trop, ni pas assez. Un style de communication sain et adapté.",
    emoji: "⚖️",
    traits: ["Adapté", "Flexible", "Naturel", "Confortable"],
  };
}

export function analyzeToxicity(
  you: PersonStats,
  other: PersonStats,
  analysis: ChatAnalysis
): ToxicityBreakdown {
  const manipulation = Math.min(100, Math.round(
    (other.totalDeleted > 10 ? 30 : 0) +
    (other.totalQuestions < you.totalQuestions * 0.2 ? 20 : 0) +
    (other.avgResponseTimeMin > you.avgResponseTimeMin * 4 ? 25 : 0) +
    (analysis.messageRatio < 0.3 ? 25 : 0)
  ));

  const loveBombing = Math.min(100, Math.round(
    (other.loveCount > you.loveCount * 3 && other.loveCount > 20 ? 40 : 0) +
    (other.avgEmojisPerMessage > 4 ? 20 : 0) +
    (other.doubleTexts > 30 ? 20 : 0) +
    (other.totalMessages > you.totalMessages * 2 ? 20 : 0)
  ));

  const ghosting = Math.min(100, Math.round(
    (other.ghostCount > 10 ? 40 : other.ghostCount > 5 ? 25 : other.ghostCount > 2 ? 10 : 0) +
    (other.avgResponseTimeMin > 180 ? 30 : other.avgResponseTimeMin > 60 ? 15 : 0) +
    (analysis.conversationGaps.length > 5 ? 30 : analysis.conversationGaps.length > 2 ? 15 : 0)
  ));

  const breadcrumbing = Math.min(100, Math.round(
    (other.avgWordsPerMessage < 3 && other.totalMessages > 20 ? 30 : 0) +
    (other.initiations > 0 && other.initiations < you.initiations * 0.2 ? 25 : 0) +
    (other.loveCount > 0 && other.loveCount < 3 && other.totalMessages > 50 ? 20 : 0) +
    (other.avgResponseTimeMin > 60 && other.totalMessages > 30 ? 25 : 0)
  ));

  const oneWayEffort = Math.min(100, Math.round(
    (analysis.messageRatio < 0.5 ? 30 : analysis.messageRatio < 0.7 ? 15 : 0) +
    (you.initiations > other.initiations * 3 ? 25 : 0) +
    (you.doubleTexts > other.doubleTexts * 3 ? 20 : 0) +
    (you.avgWordsPerMessage > other.avgWordsPerMessage * 2.5 ? 25 : 0)
  ));

  const overall = Math.round((manipulation + ghosting + breadcrumbing + oneWayEffort) / 4);
  
  let description = "";
  if (overall < 20) description = "Conversation saine, pas de toxicité détectée.";
  else if (overall < 40) description = "Quelques signaux, mais rien d'alarmant pour l'instant.";
  else if (overall < 60) description = "Attention : plusieurs comportements toxiques détectés.";
  else if (overall < 80) description = "Niveau de toxicité élevé. Cette relation n'est pas équilibrée.";
  else description = "Environnement très toxique. Protège-toi.";

  return { overall, manipulation, loveBombing, ghosting, breadcrumbing, oneWayEffort, description };
}

export function analyzeInvestment(
  you: PersonStats,
  other: PersonStats,
  analysis: ChatAnalysis
): InvestmentScore {
  const youScore = Math.min(100, Math.round(
    (you.totalMessages / Math.max(1, analysis.totalMessages)) * 60 +
    (you.initiations / Math.max(1, you.initiations + other.initiations)) * 40 +
    (you.avgWordsPerMessage > 5 ? 10 : 0) +
    (you.totalQuestions > 10 ? 5 : 0) +
    (you.loveCount > 3 ? 5 : 0)
  ));

  const otherScore = Math.min(100, Math.round(
    (other.totalMessages / Math.max(1, analysis.totalMessages)) * 60 +
    (other.initiations / Math.max(1, you.initiations + other.initiations)) * 40 +
    (other.avgWordsPerMessage > 5 ? 10 : 0) +
    (other.totalQuestions > 10 ? 5 : 0) +
    (other.loveCount > 3 ? 5 : 0)
  ));

  const diff = Math.abs(youScore - otherScore);
  let winner: "you" | "other" | "equal" = "equal";
  let description = "";

  if (diff < 10) {
    winner = "equal";
    description = "Vous êtes tous les deux investis de manière similaire.";
  } else if (youScore > otherScore) {
    winner = "you";
    description = `Tu es ${Math.round(youScore / Math.max(1, otherScore) * 10) / 10}x plus investi(e) dans cette conversation.`;
  } else {
    winner = "other";
    description = `${other.name} est ${Math.round(otherScore / Math.max(1, youScore) * 10) / 10}x plus investi(e) que toi.`;
  }

  return { you: youScore, other: otherScore, winner, description };
}

export function analyzeMomentum(analysis: ChatAnalysis): MomentumResult {
  const months = analysis.messagesByMonth;
  if (months.length < 2) {
    return { direction: "stable", emoji: "➡️", description: "Pas assez de données pour déterminer la tendance.", recentVsOld: 1 };
  }

  const recentMonths = months.slice(-2);
  const olderMonths = months.slice(0, Math.max(1, months.length - 2));

  const recentAvg = recentMonths.reduce((s, m) => s + m.you + m.other, 0) / recentMonths.length;
  const olderAvg = olderMonths.reduce((s, m) => s + m.you + m.other, 0) / olderMonths.length;

  const ratio = recentAvg / Math.max(1, olderAvg);

  if (ratio > 1.3) {
    return { direction: "rising", emoji: "📈", description: "La conversation est en hausse ! Vous échangez de plus en plus.", recentVsOld: ratio };
  }
  if (ratio < 0.3) {
    return { direction: "dead", emoji: "💀", description: "La conversation est pratiquement morte. Les échanges ont drastiquement chuté.", recentVsOld: ratio };
  }
  if (ratio < 0.7) {
    return { direction: "declining", emoji: "📉", description: "La conversation décline. Vous échangez de moins en moins.", recentVsOld: ratio };
  }
  return { direction: "stable", emoji: "➡️", description: "La conversation est stable. Rythme constant.", recentVsOld: ratio };
}

export function analyzeVocabulary(
  you: PersonStats,
  other: PersonStats
): VocabularyAnalysis {
  const youUnique = you.topWords.length;
  const otherUnique = other.topWords.length;
  const youRichness = you.totalWords > 0 ? Math.min(100, Math.round((youUnique / Math.sqrt(you.totalWords)) * 100)) : 0;
  const otherRichness = other.totalWords > 0 ? Math.min(100, Math.round((otherUnique / Math.sqrt(other.totalWords)) * 100)) : 0;

  return {
    you: { richness: youRichness, uniqueWords: youUnique, avgWordLength: you.avgWordsPerMessage },
    other: { richness: otherRichness, uniqueWords: otherUnique, avgWordLength: other.avgWordsPerMessage },
  };
}

export function calculateIck(other: PersonStats, analysis: ChatAnalysis): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (other.avgResponseTimeMin > 300) {
    reasons.push("Met plus de 5h à répondre en moyenne");
    score += 20;
  }
  if (other.avgWordsPerMessage < 2.5) {
    reasons.push("Réponses d'un mot : 'ok', 'ouais', 'mdr'");
    score += 20;
  }
  if (other.doubleTexts + other.tripleTexts === 0 && other.totalMessages > 50) {
    reasons.push("N'a JAMAIS relancé la conversation");
    score += 15;
  }
  if (other.totalQuestions === 0 && other.totalMessages > 20) {
    reasons.push("Ne pose littéralement aucune question");
    score += 20;
  }
  if (other.loveCount === 0 && analysis.totalDays > 30 && other.totalMessages > 50) {
    reasons.push("Zéro message affectueux après " + analysis.totalDays + " jours");
    score += 15;
  }
  if (other.ghostCount > 10) {
    reasons.push("Ghost plus de 10 fois dans la conversation");
    score += 15;
  }
  if (other.totalDeleted > 15) {
    reasons.push("Supprime beaucoup de messages (qu'est-ce qu'il/elle cache ?)");
    score += 10;
  }

  return { score: Math.min(100, score), reasons };
}

export function getCompatibilityDetails(analysis: ChatAnalysis): { category: string; score: number; emoji: string }[] {
  const { you, other } = analysis;
  
  const responseTimeMatch = Math.max(0, 100 - Math.abs(you.avgResponseTimeMin - other.avgResponseTimeMin) * 2);
  const effortMatch = Math.max(0, 100 - Math.abs(you.totalMessages - other.totalMessages) / Math.max(1, analysis.totalMessages) * 200);
  const emojiMatch = Math.max(0, 100 - Math.abs(you.avgEmojisPerMessage - other.avgEmojisPerMessage) * 30);
  const lengthMatch = Math.max(0, 100 - Math.abs(you.avgWordsPerMessage - other.avgWordsPerMessage) * 8);
  const initiativeMatch = Math.max(0, 100 - Math.abs(you.initiations - other.initiations) * 5);
  const humorMatch = Math.min(100, (Math.min(you.laughCount, other.laughCount) / Math.max(1, Math.max(you.laughCount, other.laughCount))) * 100);

  return [
    { category: "Temps de réponse", score: Math.round(responseTimeMatch), emoji: "⏱️" },
    { category: "Effort", score: Math.round(effortMatch), emoji: "💪" },
    { category: "Style emoji", score: Math.round(emojiMatch), emoji: "😊" },
    { category: "Longueur messages", score: Math.round(lengthMatch), emoji: "📏" },
    { category: "Initiative", score: Math.round(initiativeMatch), emoji: "🌅" },
    { category: "Humour", score: Math.round(humorMatch), emoji: "😂" },
  ];
}

export function computeAllFeatures(analysis: ChatAnalysis): FeatureResults {
  const attachment = detectAttachmentStyle(analysis.you, analysis.other, analysis);
  const texterType = detectTexterType(analysis.you);
  const otherTexterType = detectTexterType(analysis.other);
  const toxicity = analyzeToxicity(analysis.you, analysis.other, analysis);
  const investment = analyzeInvestment(analysis.you, analysis.other, analysis);
  const momentum = analyzeMomentum(analysis);
  const vocabulary = analyzeVocabulary(analysis.you, analysis.other);
  const { score: ickScore, reasons: ickReasons } = calculateIck(analysis.other, analysis);
  const compatibilityDetails = getCompatibilityDetails(analysis);

  return { attachment, texterType, otherTexterType, toxicity, investment, momentum, vocabulary, ickScore, ickReasons, compatibilityDetails };
}
