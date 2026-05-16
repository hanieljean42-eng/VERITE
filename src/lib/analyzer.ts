import { WhatsAppMessage, ParsedChat } from "./whatsapp-parser";

export type Gender = "male" | "female";
export type RelationType = "crush" | "ex" | "partner" | "friend" | "bestfriend" | "situationship" | "talking";

export interface PersonStats {
  name: string;
  gender?: Gender;
  totalMessages: number;
  totalWords: number;
  totalChars: number;
  avgWordsPerMessage: number;
  avgCharsPerMessage: number;
  longestMessage: number;
  shortestMessage: number;
  totalEmojis: number;
  avgEmojisPerMessage: number;
  topEmojis: { emoji: string; count: number }[];
  totalQuestions: number;
  totalExclamations: number;
  totalLinks: number;
  totalMedia: number;
  totalDeleted: number;
  laughCount: number;
  loveCount: number;
  initiations: number;
  lastMessageOfDay: number;
  doubleTexts: number;
  tripleTexts: number;
  avgResponseTimeMin: number;
  fastestResponseMin: number;
  slowestResponseMin: number;
  ghostCount: number;
  topWords: { word: string; count: number }[];
  messagesByHour: number[];
  messagesByDay: number[];
  activeDays: number;
  messagesPerActiveDay: number;
}

export interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  icon: string;
  score: number;
}

export interface GreenFlag {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ChatAnalysis {
  you: PersonStats;
  other: PersonStats;
  otherGender: Gender;
  relationType: RelationType;
  totalMessages: number;
  totalWords: number;
  totalDays: number;
  firstMessage: Date;
  lastMessage: Date;
  longestStreak: number;
  currentStreak: number;
  avgMessagesPerDay: number;
  peakHour: number;
  peakDay: number;
  messageRatio: number;
  effortScore: number;
  compatibilityScore: number;
  toxicityScore: number;
  interestScore: number;
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  verdict: string;
  verdictEmoji: string;
  messagesByMonth: { month: string; you: number; other: number }[];
  activityHeatmap: { hour: number; day: number; count: number }[];
  conversationGaps: { start: Date; end: Date; durationHours: number }[];
  topSharedWords: { word: string; count: number }[];
  emojiWar: { emoji: string; you: number; other: number }[];
}

const STOP_WORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en",
  "que", "qui", "dans", "pour", "pas", "sur", "ce", "il", "je", "tu",
  "nous", "vous", "ils", "elle", "on", "au", "se", "ne", "sa", "son",
  "mais", "ou", "avec", "si", "tout", "plus", "par", "cette", "mon",
  "ma", "mes", "ton", "ta", "tes", "the", "a", "an", "is", "are", "was",
  "to", "of", "in", "it", "i", "you", "he", "she", "we", "they", "my",
  "me", "your", "his", "her", "at", "do", "be", "as", "by", "so", "no",
  "not", "but", "or", "if", "up", "out", "can", "all", "has", "had",
  "c'est", "j'ai", "c", "j", "ya", "y'a", "oui", "non", "ok", "ça",
  "là", "bien", "ai", "été", "aussi", "très", "fait", "dit", "va",
]);

function getWordFrequency(
  messages: WhatsAppMessage[]
): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const msg of messages) {
    if (msg.isMedia || msg.isDeleted) continue;
    const words = msg.text
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿçœæ'-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

function getEmojiFrequency(
  messages: WhatsAppMessage[]
): { emoji: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const msg of messages) {
    for (const emoji of msg.emojis) {
      freq[emoji] = (freq[emoji] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }));
}

function getResponseTimes(
  messages: WhatsAppMessage[],
  sender: string
): number[] {
  const times: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    if (
      messages[i].sender === sender &&
      messages[i - 1].sender !== sender
    ) {
      const prev = messages[i - 1].date;
      const curr = messages[i].date;
      const diffMin = (curr.getTime() - prev.getTime()) / 60000;
      if (diffMin > 0 && diffMin < 1440) {
        times.push(diffMin);
      }
    }
  }
  return times;
}

function countInitiations(messages: WhatsAppMessage[], sender: string): number {
  let count = 0;
  let lastDate = "";
  for (const msg of messages) {
    const dateStr = msg.date.toDateString();
    if (dateStr !== lastDate) {
      if (msg.sender === sender) count++;
      lastDate = dateStr;
    }
  }
  return count;
}

function countLastMessageOfDay(
  messages: WhatsAppMessage[],
  sender: string
): number {
  let count = 0;
  for (let i = 0; i < messages.length; i++) {
    const isLast =
      i === messages.length - 1 ||
      messages[i + 1].date.toDateString() !== messages[i].date.toDateString();
    if (isLast && messages[i].sender === sender) count++;
  }
  return count;
}

function countDoubleTexts(
  messages: WhatsAppMessage[],
  sender: string
): { double: number; triple: number } {
  let double = 0;
  let triple = 0;
  let consecutive = 0;

  for (const msg of messages) {
    if (msg.sender === sender) {
      consecutive++;
    } else {
      if (consecutive >= 3) triple++;
      else if (consecutive >= 2) double++;
      consecutive = 0;
    }
  }
  return { double, triple };
}

function countGhosts(
  messages: WhatsAppMessage[],
  sender: string
): number {
  let count = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender === sender && messages[i - 1].sender !== sender) {
      const diff =
        (messages[i].date.getTime() - messages[i - 1].date.getTime()) / 3600000;
      if (diff > 24) count++;
    }
  }
  return count;
}

function getStreaks(messages: WhatsAppMessage[]): {
  longest: number;
  current: number;
} {
  const days = new Set(messages.map((m) => m.date.toDateString()));
  const sortedDays = Array.from(days)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diff =
      (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / 86400000;
    if (diff <= 1.5) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return { longest, current };
}

function buildPersonStats(
  messages: WhatsAppMessage[],
  allMessages: WhatsAppMessage[],
  name: string,
  gender?: Gender
): PersonStats {
  const textMessages = messages.filter((m) => !m.isMedia && !m.isDeleted);
  const totalWords = textMessages.reduce((s, m) => s + m.wordCount, 0);
  const totalChars = textMessages.reduce((s, m) => s + m.charCount, 0);
  const responseTimes = getResponseTimes(allMessages, name);
  const { double, triple } = countDoubleTexts(allMessages, name);
  const messagesByHour = new Array(24).fill(0);
  const messagesByDay = new Array(7).fill(0);
  const activeDaysSet = new Set<string>();

  for (const msg of messages) {
    const hourMatch = msg.time.match(/(\d{1,2}):/);
    if (hourMatch) messagesByHour[parseInt(hourMatch[1])]++;
    messagesByDay[msg.date.getDay()]++;
    activeDaysSet.add(msg.date.toDateString());
  }

  const wordLengths = textMessages.map((m) => m.wordCount).filter((w) => w > 0);

  return {
    name,
    gender,
    totalMessages: messages.length,
    totalWords,
    totalChars,
    avgWordsPerMessage: textMessages.length
      ? Math.round((totalWords / textMessages.length) * 10) / 10
      : 0,
    avgCharsPerMessage: textMessages.length
      ? Math.round((totalChars / textMessages.length) * 10) / 10
      : 0,
    longestMessage: wordLengths.length ? Math.max(...wordLengths) : 0,
    shortestMessage: wordLengths.length ? Math.min(...wordLengths) : 0,
    totalEmojis: messages.reduce((s, m) => s + m.emojiCount, 0),
    avgEmojisPerMessage: messages.length
      ? Math.round(
          (messages.reduce((s, m) => s + m.emojiCount, 0) / messages.length) *
            10
        ) / 10
      : 0,
    topEmojis: getEmojiFrequency(messages),
    totalQuestions: messages.filter((m) => m.hasQuestion).length,
    totalExclamations: messages.filter((m) => m.hasExclamation).length,
    totalLinks: messages.filter((m) => m.hasLink).length,
    totalMedia: messages.filter((m) => m.isMedia).length,
    totalDeleted: messages.filter((m) => m.isDeleted).length,
    laughCount: messages.filter((m) => m.isLaugh).length,
    loveCount: messages.filter((m) => m.isLove).length,
    initiations: countInitiations(allMessages, name),
    lastMessageOfDay: countLastMessageOfDay(allMessages, name),
    doubleTexts: double,
    tripleTexts: triple,
    avgResponseTimeMin: responseTimes.length
      ? Math.round(
          responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length
        )
      : 0,
    fastestResponseMin: responseTimes.length
      ? Math.round(Math.min(...responseTimes))
      : 0,
    slowestResponseMin: responseTimes.length
      ? Math.round(Math.max(...responseTimes))
      : 0,
    ghostCount: countGhosts(allMessages, name),
    topWords: getWordFrequency(messages),
    messagesByHour,
    messagesByDay,
    activeDays: activeDaysSet.size,
    messagesPerActiveDay: activeDaysSet.size
      ? Math.round((messages.length / activeDaysSet.size) * 10) / 10
      : 0,
  };
}

const RELATION_LABELS: Record<RelationType, string> = {
  crush: "Crush",
  ex: "Ex",
  partner: "Partenaire",
  friend: "Ami(e)",
  bestfriend: "Meilleur(e) ami(e)",
  situationship: "Situationship",
  talking: "Talking stage",
};

const RELATION_CONTEXT: Record<RelationType, { romantic: boolean; expectEffort: boolean; expectAffection: boolean }> = {
  crush: { romantic: true, expectEffort: false, expectAffection: false },
  ex: { romantic: true, expectEffort: false, expectAffection: false },
  partner: { romantic: true, expectEffort: true, expectAffection: true },
  friend: { romantic: false, expectEffort: false, expectAffection: false },
  bestfriend: { romantic: false, expectEffort: true, expectAffection: false },
  situationship: { romantic: true, expectEffort: false, expectAffection: false },
  talking: { romantic: true, expectEffort: false, expectAffection: false },
};

function detectRedFlags(
  you: PersonStats,
  other: PersonStats,
  otherGender: Gender,
  relationType: RelationType,
  messages: WhatsAppMessage[]
): RedFlag[] {
  const flags: RedFlag[] = [];
  const genderLabel = otherGender === "female" ? "Elle" : "Il";
  const ctx = RELATION_CONTEXT[relationType];
  const rl = RELATION_LABELS[relationType];

  const ratio =
    you.totalMessages > 0 ? other.totalMessages / you.totalMessages : 0;

  // Effort imbalance — more concerning for crush/partner/talking
  if (ratio < 0.4) {
    const severity = ctx.romantic ? "high" : "medium";
    const desc = relationType === "crush"
      ? `Tu envoies ${Math.round((1 / ratio) * 10) / 10}x plus de messages. Ton crush ne fait clairement pas le même effort — c'est révélateur.`
      : relationType === "ex"
      ? `Tu envoies ${Math.round((1 / ratio) * 10) / 10}x plus de messages à ton ex. Tu n'as pas encore lâché prise.`
      : relationType === "partner"
      ? `Tu envoies ${Math.round((1 / ratio) * 10) / 10}x plus de messages. Dans un couple, cet écart est problématique.`
      : `Tu envoies ${Math.round((1 / ratio) * 10) / 10}x plus de messages que ${genderLabel.toLowerCase()}.`;
    flags.push({
      id: "effort-imbalance",
      title: "Déséquilibre d'effort",
      description: desc,
      severity,
      icon: "⚖️",
      score: ctx.romantic ? 85 : 55,
    });
  } else if (ratio < 0.6) {
    flags.push({
      id: "slight-imbalance",
      title: "Léger déséquilibre",
      description: `Tu envoies plus de messages, mais l'écart reste modéré.`,
      severity: "medium",
      icon: "📊",
      score: 50,
    });
  }

  // Slow replies
  if (other.avgResponseTimeMin > you.avgResponseTimeMin * 3 && other.avgResponseTimeMin > 60) {
    const desc = relationType === "crush"
      ? `Ton crush répond en ${other.avgResponseTimeMin} min vs toi en ${you.avgResponseTimeMin} min. ${other.avgResponseTimeMin > 180 ? "Signe de désintérêt fort." : "Prudence."}`
      : relationType === "partner"
      ? `Ton/ta partenaire répond en ${other.avgResponseTimeMin} min vs toi en ${you.avgResponseTimeMin} min. Ce n'est pas normal dans un couple.`
      : relationType === "ex"
      ? `Ton ex répond lentement (${other.avgResponseTimeMin} min). ${genderLabel} prend ses distances, c'est peut-être mieux ainsi.`
      : `${genderLabel} répond en ${other.avgResponseTimeMin} min vs toi ${you.avgResponseTimeMin} min.`;
    flags.push({
      id: "slow-replies",
      title: `${genderLabel} met du temps à répondre`,
      description: desc,
      severity: other.avgResponseTimeMin > 180 ? "high" : "medium",
      icon: "🐌",
      score: other.avgResponseTimeMin > 180 ? 80 : 50,
    });
  }

  // Short replies
  if (other.avgWordsPerMessage < 4 && you.avgWordsPerMessage > 8) {
    const desc = relationType === "crush"
      ? `Ton crush envoie ${other.avgWordsPerMessage} mots/msg vs toi ${you.avgWordsPerMessage}. ${genderLabel} ne fait pas d'effort pour te parler.`
      : relationType === "partner"
      ? `Ton/ta partenaire envoie ${other.avgWordsPerMessage} mots/msg. C'est inquiétant pour un couple — la communication se dégrade.`
      : `${genderLabel} envoie ${other.avgWordsPerMessage} mots/msg vs toi ${you.avgWordsPerMessage}. Minimum syndical.`;
    flags.push({
      id: "short-replies",
      title: "Réponses ultra-courtes",
      description: desc,
      severity: ctx.romantic ? "high" : "medium",
      icon: "📝",
      score: ctx.romantic ? 75 : 45,
    });
  }

  // Double texting
  if (you.doubleTexts + you.tripleTexts > 20 && other.doubleTexts + other.tripleTexts < 5) {
    const desc = relationType === "crush"
      ? `Tu relances ${you.doubleTexts + you.tripleTexts} fois sans réponse. Ton crush te laisse en attente — arrête de courir.`
      : relationType === "ex"
      ? `Tu relances ton ex ${you.doubleTexts + you.tripleTexts} fois. C'est un signe que tu n'as pas tourné la page.`
      : `Tu envoies des messages sans réponse ${you.doubleTexts + you.tripleTexts} fois. ${genderLabel} ne relance jamais.`;
    flags.push({
      id: "double-texting",
      title: "Tu relances trop",
      description: desc,
      severity: "medium",
      icon: "📱",
      score: relationType === "crush" ? 70 : 60,
    });
  }

  // Ghosting
  if (other.ghostCount > 5) {
    const desc = relationType === "partner"
      ? `Ton/ta partenaire a disparu +24h ${other.ghostCount} fois. C'est un manque de respect dans un couple.`
      : relationType === "crush"
      ? `Ton crush te ghost ${other.ghostCount} fois. ${genderLabel} n'est clairement pas intéressé(e).`
      : relationType === "ex"
      ? `Ton ex disparaît ${other.ghostCount} fois. ${genderLabel} revient quand ça l'arrange.`
      : relationType === "situationship"
      ? `${genderLabel} disparaît ${other.ghostCount} fois. Typique d'un situationship — ${genderLabel.toLowerCase()} n'est pas engagé(e).`
      : `${genderLabel} a disparu +24h au moins ${other.ghostCount} fois.`;
    flags.push({
      id: "ghosting",
      title: "Ghosting fréquent",
      description: desc,
      severity: other.ghostCount > 15 ? "critical" : "high",
      icon: "👻",
      score: other.ghostCount > 15 ? 95 : 70,
    });
  }

  // Always initiating
  if (you.initiations > other.initiations * 2.5 && you.initiations > 10) {
    const desc = relationType === "crush"
      ? `Tu inities ${you.initiations}x vs ton crush ${other.initiations}x. Si ${genderLabel.toLowerCase()} voulait te parler, ${genderLabel.toLowerCase()} le ferait.`
      : relationType === "partner"
      ? `Tu commences la conversation ${you.initiations} fois vs ${other.initiations}. Ton/ta partenaire ne pense pas à toi spontanément.`
      : `Tu inities ${you.initiations} fois vs ${other.initiations}. ${genderLabel} ne prend jamais l'initiative.`;
    flags.push({
      id: "always-initiating",
      title: "Tu commences toujours la conversation",
      description: desc,
      severity: ctx.romantic ? "high" : "medium",
      icon: "🚩",
      score: ctx.romantic ? 80 : 50,
    });
  }

  // Deleted messages
  if (other.totalDeleted > 10) {
    flags.push({
      id: "deleted-messages",
      title: "Messages supprimés suspects",
      description: `${genderLabel} a supprimé ${other.totalDeleted} messages. Qu'est-ce qu'${otherGender === "female" ? "elle" : "il"} cache ?`,
      severity: "medium",
      icon: "🗑️",
      score: 55,
    });
  }

  // No affection — only relevant for romantic relations
  if (ctx.romantic && other.loveCount === 0 && you.loveCount > 5) {
    const desc = relationType === "crush"
      ? `Tu envoies ${you.loveCount} messages affectueux. Ton crush : 0. Les sentiments ne sont pas réciproques.`
      : relationType === "partner"
      ? `Tu envoies ${you.loveCount} messages affectueux. Ton/ta partenaire : 0. Où est passée l'affection ?`
      : `Tu envoies ${you.loveCount} messages affectueux. ${genderLabel} : 0.`;
    flags.push({
      id: "no-love",
      title: "Zéro affection",
      description: desc,
      severity: "high",
      icon: "💔",
      score: relationType === "partner" ? 90 : 85,
    });
  }

  // Late night only — more suspicious for crush/situationship
  const otherLateNight = other.messagesByHour
    .slice(23)
    .concat(other.messagesByHour.slice(0, 5))
    .reduce((a, b) => a + b, 0);
  const otherDaytime = other.messagesByHour
    .slice(8, 20)
    .reduce((a, b) => a + b, 0);

  if (otherLateNight > otherDaytime * 0.5 && otherLateNight > 20) {
    const desc = relationType === "crush" || relationType === "situationship"
      ? `${genderLabel} t'écrit surtout entre 23h et 5h. Tu es un plan B nocturne, pas une priorité.`
      : `${genderLabel} t'écrit surtout entre 23h et 5h.`;
    flags.push({
      id: "late-night-only",
      title: "Messages uniquement la nuit",
      description: desc,
      severity: ctx.romantic ? "high" : "medium",
      icon: "🌙",
      score: relationType === "situationship" ? 75 : 65,
    });
  }

  // No curiosity
  if (other.totalQuestions < you.totalQuestions * 0.3 && you.totalQuestions > 10) {
    flags.push({
      id: "no-curiosity",
      title: `${genderLabel} ne te pose jamais de questions`,
      description: `Tu poses ${you.totalQuestions} questions vs ${other.totalQuestions}. ${genderLabel} ne s'intéresse pas à ta vie.`,
      severity: "medium",
      icon: "❓",
      score: 60,
    });
  }

  // Ex-specific: breadcrumbing
  if (relationType === "ex" && other.loveCount > 3 && other.ghostCount > 5) {
    flags.push({
      id: "breadcrumbing",
      title: "Breadcrumbing",
      description: `Ton ex alterne entre affection (${other.loveCount} msgs doux) et disparitions (${other.ghostCount} ghosts). ${genderLabel} te garde en option.`,
      severity: "critical",
      icon: "🍞",
      score: 90,
    });
  }

  // Crush-specific: you're way more invested
  if (relationType === "crush" && you.loveCount > 10 && other.loveCount < 2) {
    flags.push({
      id: "unrequited",
      title: "Sentiments à sens unique",
      description: `Tu montres tes sentiments (${you.loveCount} msgs affectueux) mais ton crush ne réagit pas (${other.loveCount}). Ce n'est pas réciproque.`,
      severity: "critical",
      icon: "💘",
      score: 92,
    });
  }

  // Partner-specific: conversation dying
  if (relationType === "partner" && other.avgWordsPerMessage < 5 && other.initiations < you.initiations * 0.3) {
    flags.push({
      id: "dying-relationship",
      title: "La communication se meurt",
      description: `Messages courts + aucune initiative de ton/ta partenaire. La relation perd en qualité.`,
      severity: "critical",
      icon: "📉",
      score: 88,
    });
  }

  // Situationship-specific
  if (relationType === "situationship" && other.loveCount > 5 && other.ghostCount > 5) {
    flags.push({
      id: "hot-cold",
      title: "Hot & Cold",
      description: `${genderLabel} alterne entre moments intenses et disparitions. C'est le signe d'un situationship toxique.`,
      severity: "high",
      icon: "🔥❄️",
      score: 80,
    });
  }

  return flags.sort((a, b) => b.score - a.score);
}

function detectGreenFlags(
  you: PersonStats,
  other: PersonStats,
  otherGender: Gender
): GreenFlag[] {
  const flags: GreenFlag[] = [];
  const genderLabel = otherGender === "female" ? "Elle" : "Il";
  const ratio =
    you.totalMessages > 0 ? other.totalMessages / you.totalMessages : 0;

  if (ratio > 0.7 && ratio < 1.4) {
    flags.push({
      id: "balanced",
      title: "Conversation équilibrée",
      description: "Vous envoyez autant de messages l'un que l'autre. Bel équilibre !",
      icon: "✅",
    });
  }

  if (
    Math.abs(other.avgResponseTimeMin - you.avgResponseTimeMin) < 15 &&
    other.avgResponseTimeMin < 30
  ) {
    flags.push({
      id: "matching-energy",
      title: "Même énergie de réponse",
      description: `Vous répondez tous les deux en ~${Math.round((you.avgResponseTimeMin + other.avgResponseTimeMin) / 2)} min. Vous êtes sur la même longueur d'onde.`,
      icon: "⚡",
    });
  }

  if (other.loveCount > 5 && you.loveCount > 5) {
    flags.push({
      id: "mutual-love",
      title: "Affection mutuelle",
      description: `${genderLabel} envoie ${other.loveCount} messages affectueux et toi ${you.loveCount}. L'amour est réciproque !`,
      icon: "💕",
    });
  }

  if (other.laughCount > 10 && you.laughCount > 10) {
    flags.push({
      id: "humor",
      title: "Vous riez ensemble",
      description: `Vous partagez ${you.laughCount + other.laughCount} rires dans cette conversation. L'humour est au rendez-vous !`,
      icon: "😂",
    });
  }

  if (Math.abs(other.initiations - you.initiations) < 5) {
    flags.push({
      id: "mutual-initiative",
      title: "Initiative partagée",
      description: `${genderLabel} initie la conversation ${other.initiations} fois, toi ${you.initiations}. Personne ne fait tout le travail.`,
      icon: "🤝",
    });
  }

  return flags;
}

function generateVerdict(
  redFlags: RedFlag[],
  greenFlags: GreenFlag[],
  otherGender: Gender,
  relationType: RelationType
): { verdict: string; emoji: string } {
  const maxSeverity = redFlags.length
    ? Math.max(...redFlags.map((f) => f.score))
    : 0;
  const avgScore = redFlags.length
    ? redFlags.reduce((s, f) => s + f.score, 0) / redFlags.length
    : 0;
  const G = otherGender === "female" ? "Elle" : "Il";
  const g = otherGender === "female" ? "elle" : "il";

  // Relation-specific verdicts
  if (redFlags.length === 0 && greenFlags.length >= 3) {
    const msg = relationType === "crush" ? `Ton crush est réceptif ! ${G} fait des efforts. Fonce !`
      : relationType === "ex" ? `Surprenant — ton ex montre encore des signes positifs. Mais reste prudent(e).`
      : relationType === "partner" ? `Votre couple est solide ! Communication saine, efforts mutuels. 💪`
      : relationType === "friend" ? `Une vraie amitié ! Vous êtes sur la même longueur d'onde.`
      : relationType === "bestfriend" ? `C'est ça un(e) meilleur(e) ami(e) ! Relation au top. 🫶`
      : `C'est du solide ! ${G} est investi(e) autant que toi.`;
    return { verdict: msg, emoji: "💚" };
  }
  if (redFlags.length <= 1 && greenFlags.length >= 2) {
    const msg = relationType === "crush" ? `Signaux plutôt positifs de ton crush. Continue d'observer mais c'est encourageant.`
      : relationType === "partner" ? `Votre couple va bien. Quelques points d'attention mineurs.`
      : `Globalement positif. ${g} semble sincère.`;
    return { verdict: msg, emoji: "💛" };
  }
  if (avgScore > 75) {
    const msg = relationType === "crush" ? `🚩 Ton crush ne s'intéresse pas à toi autant que tu t'intéresses à ${g}. Protège-toi.`
      : relationType === "ex" ? `🚩 Ton ex te fait du mal. Trop de red flags — il est temps de couper les ponts.`
      : relationType === "partner" ? `🚩 Ton couple est en danger. ${G} ne fait plus d'efforts. Discussion sérieuse nécessaire.`
      : relationType === "situationship" ? `🚩 Ce situationship est toxique. ${G} profite de l'ambiguïté. Exige de la clarté.`
      : `🚩 Trop de red flags. ${G} ne fait pas le même effort que toi.`;
    return { verdict: msg, emoji: "🚩" };
  }
  if (avgScore > 50) {
    const msg = relationType === "crush" ? `Zone grise. Ton crush envoie des signaux mitigés. N'investis pas trop tant que ce n'est pas clair.`
      : relationType === "ex" ? `Signaux mitigés de ton ex. ${G} hésite entre revenir et partir. Ne te fais pas manipuler.`
      : relationType === "situationship" ? `C'est flou, comme tout situationship. ${G} ne se mouille pas. Pose tes limites.`
      : `Zone grise. ${G} montre des signes mitigés. Observe bien.`;
    return { verdict: msg, emoji: "🟡" };
  }
  if (maxSeverity > 80) {
    const msg = relationType === "crush" ? `Red flag critique. Ton crush ne mérite pas ton énergie.`
      : relationType === "partner" ? `Red flag critique dans ton couple. ${G} ne te traite pas correctement.`
      : `Red flag critique détecté. ${G} ne te traite pas comme tu le mérites.`;
    return { verdict: msg, emoji: "❌" };
  }
  return { verdict: `Résultats mixtes. Prends du recul et observe.`, emoji: "🤔" };
}

export function analyzeChat(
  parsed: ParsedChat,
  youName: string,
  otherName: string,
  otherGender: Gender,
  relationType: RelationType = "crush"
): ChatAnalysis {
  const yourMessages = parsed.messages.filter((m) => m.sender === youName);
  const otherMessages = parsed.messages.filter((m) => m.sender === otherName);

  const you = buildPersonStats(yourMessages, parsed.messages, youName);
  const other = buildPersonStats(otherMessages, parsed.messages, otherName, otherGender);

  const streaks = getStreaks(parsed.messages);
  const firstMessage =
    parsed.messages.length > 0
      ? parsed.messages[0].date
      : new Date();
  const lastMessage =
    parsed.messages.length > 0
      ? parsed.messages[parsed.messages.length - 1].date
      : new Date();

  const totalDays = Math.max(
    1,
    Math.ceil(
      (lastMessage.getTime() - firstMessage.getTime()) / 86400000
    )
  );

  const peakHour = you.messagesByHour.indexOf(
    Math.max(...you.messagesByHour.concat(other.messagesByHour))
  );
  const combinedByDay = you.messagesByDay.map(
    (v, i) => v + other.messagesByDay[i]
  );
  const peakDay = combinedByDay.indexOf(Math.max(...combinedByDay));

  const ratio = you.totalMessages > 0
    ? Math.round((other.totalMessages / you.totalMessages) * 100) / 100
    : 0;

  const effortScore = Math.min(
    100,
    Math.round(
      (ratio * 30 +
        Math.min(1, other.avgWordsPerMessage / Math.max(1, you.avgWordsPerMessage)) * 25 +
        Math.min(1, other.initiations / Math.max(1, you.initiations)) * 25 +
        Math.min(1, you.avgResponseTimeMin / Math.max(1, other.avgResponseTimeMin)) * 20) 
    )
  );

  // Monthly breakdown
  const monthlyMap: Record<string, { you: number; other: number }> = {};
  for (const msg of parsed.messages) {
    const key = `${msg.date.getFullYear()}-${String(msg.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { you: 0, other: 0 };
    if (msg.sender === youName) monthlyMap[key].you++;
    else monthlyMap[key].other++;
  }
  const messagesByMonth = Object.entries(monthlyMap)
    .sort()
    .map(([month, data]) => ({ month, ...data }));

  // Heatmap
  const heatmapMap: Record<string, number> = {};
  for (const msg of parsed.messages) {
    const hourMatch = msg.time.match(/(\d{1,2}):/);
    const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
    const day = msg.date.getDay();
    const key = `${hour}-${day}`;
    heatmapMap[key] = (heatmapMap[key] || 0) + 1;
  }
  const activityHeatmap = Object.entries(heatmapMap).map(([key, count]) => {
    const [hour, day] = key.split("-").map(Number);
    return { hour, day, count };
  });

  // Conversation gaps
  const gaps: { start: Date; end: Date; durationHours: number }[] = [];
  for (let i = 1; i < parsed.messages.length; i++) {
    const diff =
      (parsed.messages[i].date.getTime() -
        parsed.messages[i - 1].date.getTime()) /
      3600000;
    if (diff > 48) {
      gaps.push({
        start: parsed.messages[i - 1].date,
        end: parsed.messages[i].date,
        durationHours: Math.round(diff),
      });
    }
  }

  // Emoji war
  const allEmojis = new Set([
    ...you.topEmojis.map((e) => e.emoji),
    ...other.topEmojis.map((e) => e.emoji),
  ]);
  const emojiWar = Array.from(allEmojis)
    .map((emoji) => ({
      emoji,
      you: you.topEmojis.find((e) => e.emoji === emoji)?.count || 0,
      other: other.topEmojis.find((e) => e.emoji === emoji)?.count || 0,
    }))
    .sort((a, b) => b.you + b.other - (a.you + a.other))
    .slice(0, 8);

  const redFlags = detectRedFlags(you, other, otherGender, relationType, parsed.messages);
  const greenFlags = detectGreenFlags(you, other, otherGender);
  const { verdict, emoji: verdictEmoji } = generateVerdict(redFlags, greenFlags, otherGender, relationType);

  const interestScore = Math.max(0, Math.min(100, effortScore + greenFlags.length * 8 - redFlags.length * 12));
  const toxicityScore = Math.min(100, redFlags.reduce((s, f) => s + f.score, 0) / Math.max(1, redFlags.length));
  const compatibilityScore = Math.max(0, Math.min(100, 
    50 + greenFlags.length * 10 - redFlags.length * 8 + (ratio > 0.7 && ratio < 1.4 ? 15 : -10)
  ));

  return {
    you,
    other,
    otherGender,
    relationType,
    totalMessages: parsed.messages.length,
    totalWords: you.totalWords + other.totalWords,
    totalDays,
    firstMessage,
    lastMessage,
    longestStreak: streaks.longest,
    currentStreak: streaks.current,
    avgMessagesPerDay: Math.round((parsed.messages.length / totalDays) * 10) / 10,
    peakHour,
    peakDay,
    messageRatio: ratio,
    effortScore,
    compatibilityScore,
    toxicityScore,
    interestScore,
    redFlags,
    greenFlags,
    verdict,
    verdictEmoji,
    messagesByMonth,
    activityHeatmap,
    conversationGaps: gaps.sort((a, b) => b.durationHours - a.durationHours).slice(0, 10),
    topSharedWords: getWordFrequency(parsed.messages),
    emojiWar,
  };
}
