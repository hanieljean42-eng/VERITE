import { ChatAnalysis } from "./analyzer";
import { WhatsAppMessage } from "./whatsapp-parser";

// ════════ SCORE GLOBAL ════════
export function computeGlobalScore(analysis: ChatAnalysis): number {
  const effort = analysis.effortScore * 0.3;
  const compat = analysis.compatibilityScore * 0.25;
  const interest = analysis.interestScore * 0.25;
  const health = Math.max(0, 100 - analysis.toxicityScore) * 0.2;
  return Math.round(effort + compat + interest + health);
}

export function getScoreLabel(score: number): { label: string; emoji: string; color: string } {
  if (score >= 80) return { label: "Il/elle est à fond", emoji: "💚", color: "#06d6a0" };
  if (score >= 65) return { label: "Plutôt positif", emoji: "💛", color: "#fbbf24" };
  if (score >= 45) return { label: "Zone grise", emoji: "🟡", color: "#f97316" };
  if (score >= 25) return { label: "Signaux négatifs", emoji: "🟠", color: "#ef4444" };
  return { label: "Fuis", emoji: "🚩", color: "#dc2626" };
}

// ════════ PATTERNS TEMPORELS ════════
export interface TemporalPattern {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: "positive" | "negative" | "neutral";
}

export function detectTemporalPatterns(analysis: ChatAnalysis, messages: WhatsAppMessage[]): TemporalPattern[] {
  const patterns: TemporalPattern[] = [];
  const { you, other } = analysis;
  const gLabel = analysis.otherGender === "female" ? "Elle" : "Il";

  // Weekend vs weekday activity
  const weekdayMsgs = [1, 2, 3, 4, 5].reduce((s, d) => s + other.messagesByDay[d], 0);
  const weekendMsgs = other.messagesByDay[0] + other.messagesByDay[6];
  const weekendRatio = weekendMsgs / Math.max(1, weekdayMsgs) * 5;

  if (weekendRatio > 1.8) {
    patterns.push({
      id: "weekend-only",
      title: "Disponible que le week-end",
      description: `${gLabel} t'écrit ${Math.round(weekendRatio * 100) / 100}x plus le week-end que la semaine. Tu n'es peut-être pas sa priorité en semaine.`,
      emoji: "📅",
      type: "negative",
    });
  } else if (weekendRatio < 0.3 && weekendMsgs > 0) {
    patterns.push({
      id: "weekday-only",
      title: "Silence le week-end",
      description: `${gLabel} est beaucoup moins présent(e) le week-end. ${gLabel} est peut-être occupé(e) avec quelqu'un d'autre.`,
      emoji: "🤔",
      type: "negative",
    });
  }

  // Late night pattern
  const lateNight = other.messagesByHour.slice(22).concat(other.messagesByHour.slice(0, 5)).reduce((a, b) => a + b, 0);
  const daytime = other.messagesByHour.slice(8, 22).reduce((a, b) => a + b, 0);
  if (lateNight > daytime * 0.6 && lateNight > 15) {
    patterns.push({
      id: "late-night",
      title: "Messageur nocturne",
      description: `${gLabel} t'écrit principalement entre 22h et 5h du matin. Tu es son plan nuit, pas son plan vie.`,
      emoji: "🌙",
      type: "negative",
    });
  }

  // Morning person
  const morning = other.messagesByHour.slice(6, 10).reduce((a, b) => a + b, 0);
  if (morning > other.totalMessages * 0.3) {
    patterns.push({
      id: "morning-person",
      title: "Tu es sa première pensée",
      description: `${gLabel} t'écrit souvent le matin. Tu fais partie de sa routine, c'est un très bon signe.`,
      emoji: "🌅",
      type: "positive",
    });
  }

  // Monthly decline detection
  const months = analysis.messagesByMonth;
  if (months.length >= 3) {
    const recent = months.slice(-2).reduce((s, m) => s + m.other, 0) / 2;
    const older = months.slice(0, -2).reduce((s, m) => s + m.other, 0) / Math.max(1, months.length - 2);
    if (recent < older * 0.4 && older > 10) {
      patterns.push({
        id: "declining-interest",
        title: "Intérêt en chute libre",
        description: `${gLabel} t'écrit ${Math.round((1 - recent / older) * 100)}% de moins qu'avant. L'intérêt diminue clairement.`,
        emoji: "📉",
        type: "negative",
      });
    } else if (recent > older * 1.5 && recent > 10) {
      patterns.push({
        id: "rising-interest",
        title: "Intérêt grandissant",
        description: `${gLabel} t'écrit de plus en plus ! ${Math.round((recent / older - 1) * 100)}% de plus récemment.`,
        emoji: "📈",
        type: "positive",
      });
    }
  }

  // Gap after specific events
  if (analysis.conversationGaps.length > 3) {
    patterns.push({
      id: "frequent-gaps",
      title: "Silences fréquents",
      description: `${analysis.conversationGaps.length} périodes de silence de +48h. La conversation n'est pas fluide.`,
      emoji: "😶",
      type: "negative",
    });
  }

  // Consistent pattern (positive)
  const activeMonths = months.filter(m => (m.you + m.other) > 10).length;
  if (activeMonths >= 4 && analysis.avgMessagesPerDay > 5) {
    patterns.push({
      id: "consistent",
      title: "Relation stable",
      description: `Vous échangez régulièrement depuis ${activeMonths} mois avec une moyenne de ${analysis.avgMessagesPerDay} msg/jour. C'est solide.`,
      emoji: "🤝",
      type: "positive",
    });
  }

  return patterns;
}

// ════════ CITATIONS MARQUANTES ════════
export interface NotableMessage {
  text: string;
  sender: string;
  date: Date;
  type: "longest" | "love" | "question" | "funny" | "emotional";
  label: string;
}

export function extractNotableMessages(messages: WhatsAppMessage[], youName: string, otherName: string): NotableMessage[] {
  const notable: NotableMessage[] = [];
  const otherMsgs = messages.filter(m => m.sender === otherName && !m.isMedia && !m.isDeleted);
  const yourMsgs = messages.filter(m => m.sender === youName && !m.isMedia && !m.isDeleted);

  // Longest message from other
  const longestOther = otherMsgs.sort((a, b) => b.charCount - a.charCount)[0];
  if (longestOther && longestOther.charCount > 50) {
    notable.push({
      text: longestOther.text.substring(0, 200) + (longestOther.text.length > 200 ? "..." : ""),
      sender: otherName,
      date: longestOther.date,
      type: "longest",
      label: "Message le plus long",
    });
  }

  // Love messages (keywords)
  const loveKeywords = ["je t'aime", "i love you", "tu me manques", "you mean", "t'es tout", "amour", "mon coeur", "mon bb", "mon bébé"];
  const loveMsg = otherMsgs.find(m => loveKeywords.some(k => m.text.toLowerCase().includes(k)));
  if (loveMsg) {
    notable.push({
      text: loveMsg.text.substring(0, 200),
      sender: otherName,
      date: loveMsg.date,
      type: "love",
      label: "Message d'amour",
    });
  }

  // Funniest (most laughs following)
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].sender === otherName && !messages[i].isMedia && messages[i].charCount > 10) {
      if (messages[i + 1]?.isLaugh && messages[i + 1]?.sender === youName) {
        notable.push({
          text: messages[i].text.substring(0, 200),
          sender: otherName,
          date: messages[i].date,
          type: "funny",
          label: "Message drôle",
        });
        break;
      }
    }
  }

  // Most emotional (exclamation + emojis)
  const emotional = otherMsgs
    .filter(m => m.hasExclamation && m.emojiCount > 2 && m.charCount > 20)
    .sort((a, b) => b.emojiCount - a.emojiCount)[0];
  if (emotional) {
    notable.push({
      text: emotional.text.substring(0, 200),
      sender: otherName,
      date: emotional.date,
      type: "emotional",
      label: "Message émotionnel",
    });
  }

  return notable.slice(0, 5);
}

// ════════ JALONS RELATIONNELS ════════
export interface Milestone {
  title: string;
  date: Date;
  emoji: string;
  description: string;
}

export function detectMilestones(messages: WhatsAppMessage[], youName: string, otherName: string): Milestone[] {
  const milestones: Milestone[] = [];

  if (messages.length === 0) return milestones;

  // First message ever
  milestones.push({
    title: "Premier message",
    date: messages[0].date,
    emoji: "🎉",
    description: `${messages[0].sender} a envoyé le premier message`,
  });

  // First "je t'aime" or love declaration
  const lovePatterns = ["je t'aime", "i love you", "je t aime"];
  for (const msg of messages) {
    if (lovePatterns.some(p => msg.text.toLowerCase().includes(p))) {
      milestones.push({
        title: "Premier \"je t'aime\"",
        date: msg.date,
        emoji: "💕",
        description: `${msg.sender} l'a dit en premier`,
      });
      break;
    }
  }

  // 100th message
  if (messages.length >= 100) {
    milestones.push({
      title: "100 messages",
      date: messages[99].date,
      emoji: "💯",
      description: "La conversation prend de l'ampleur",
    });
  }

  // 1000th message
  if (messages.length >= 1000) {
    milestones.push({
      title: "1000 messages",
      date: messages[999].date,
      emoji: "🔥",
      description: "Vous êtes clairement accros",
    });
  }

  // First call/media shared
  const firstMedia = messages.find(m => m.isMedia);
  if (firstMedia) {
    milestones.push({
      title: "Premier média partagé",
      date: firstMedia.date,
      emoji: "📷",
      description: `${firstMedia.sender} a envoyé le premier média`,
    });
  }

  // Longest gap (could be a breakup)
  let maxGap = 0;
  let gapStart: Date | null = null;
  let gapEnd: Date | null = null;
  for (let i = 1; i < messages.length; i++) {
    const diff = (messages[i].date.getTime() - messages[i - 1].date.getTime()) / 86400000;
    if (diff > maxGap) {
      maxGap = diff;
      gapStart = messages[i - 1].date;
      gapEnd = messages[i].date;
    }
  }
  if (maxGap > 7 && gapStart && gapEnd) {
    milestones.push({
      title: `Plus long silence (${Math.round(maxGap)}j)`,
      date: gapStart,
      emoji: "😶",
      description: "Période sans échange",
    });
  }

  // Peak day (most messages in a single day)
  const dayCount: Record<string, { count: number; date: Date }> = {};
  for (const msg of messages) {
    const key = msg.date.toDateString();
    if (!dayCount[key]) dayCount[key] = { count: 0, date: msg.date };
    dayCount[key].count++;
  }
  const peakDay = Object.values(dayCount).sort((a, b) => b.count - a.count)[0];
  if (peakDay && peakDay.count > 50) {
    milestones.push({
      title: `Jour record (${peakDay.count} msgs)`,
      date: peakDay.date,
      emoji: "⚡",
      description: "Votre journée la plus intense",
    });
  }

  return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ════════ CONSEILS PERSONNALISÉS ════════
export interface Advice {
  text: string;
  emoji: string;
  type: "warning" | "tip" | "encouragement";
}

export function generateAdvice(analysis: ChatAnalysis): Advice[] {
  const advices: Advice[] = [];
  const { you, other } = analysis;
  const gLabel = analysis.otherGender === "female" ? "elle" : "il";
  const GLabel = analysis.otherGender === "female" ? "Elle" : "Il";

  // Response time advice
  if (other.avgResponseTimeMin > you.avgResponseTimeMin * 3 && other.avgResponseTimeMin > 60) {
    advices.push({
      text: `${GLabel} met ${other.avgResponseTimeMin}min en moyenne à répondre contre ${you.avgResponseTimeMin}min pour toi. Ralentis ton rythme — ne sois pas toujours disponible immédiatement.`,
      emoji: "⏰",
      type: "tip",
    });
  }

  // Initiative imbalance
  if (you.initiations > other.initiations * 2.5) {
    advices.push({
      text: `Tu initie ${you.initiations} fois contre ${other.initiations} pour ${gLabel}. Arrête d'écrire en premier pendant quelques jours et observe si ${gLabel} vient vers toi.`,
      emoji: "🧪",
      type: "tip",
    });
  }

  // Double texting
  if (you.doubleTexts > other.doubleTexts * 3 && you.doubleTexts > 10) {
    advices.push({
      text: `Tu relances ${you.doubleTexts} fois sans réponse. Chaque relance non réciproque diminue ta valeur perçue. Laisse de l'espace.`,
      emoji: "🛑",
      type: "warning",
    });
  }

  // Low effort from other
  if (other.avgWordsPerMessage < 4 && you.avgWordsPerMessage > 8) {
    advices.push({
      text: `Tes messages font ${you.avgWordsPerMessage} mots en moyenne, les siens ${other.avgWordsPerMessage}. Réduis la longueur de tes messages pour matcher son énergie.`,
      emoji: "📏",
      type: "tip",
    });
  }

  // Good signs
  if (other.initiations > you.initiations * 0.8 && other.avgResponseTimeMin < 30) {
    advices.push({
      text: `${GLabel} initie presque autant que toi et répond vite. C'est un excellent signe d'intérêt mutuel. Continue sur cette lancée !`,
      emoji: "💪",
      type: "encouragement",
    });
  }

  // Ghost pattern
  if (other.ghostCount > 5) {
    advices.push({
      text: `${GLabel} a disparu ${other.ghostCount} fois. Quand quelqu'un veut te parler, il trouve le temps. Point.`,
      emoji: "💀",
      type: "warning",
    });
  }

  // Questions
  if (other.totalQuestions < 5 && you.totalQuestions > 20) {
    advices.push({
      text: `Tu poses ${you.totalQuestions} questions, ${gLabel} en pose ${other.totalQuestions}. Une personne intéressée pose des questions. Arrête de mener la conversation seul(e).`,
      emoji: "❓",
      type: "warning",
    });
  }

  // Positive ratio
  if (analysis.messageRatio > 0.8 && analysis.messageRatio < 1.3) {
    advices.push({
      text: "Votre ratio de messages est équilibré. C'est le signe d'une conversation saine où les deux font des efforts.",
      emoji: "⚖️",
      type: "encouragement",
    });
  }

  return advices.slice(0, 5);
}
