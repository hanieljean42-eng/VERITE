import { WhatsAppMessage, ParsedChat } from "./whatsapp-parser";

export type Gender = "male" | "female";

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

function detectRedFlags(
  you: PersonStats,
  other: PersonStats,
  otherGender: Gender,
  messages: WhatsAppMessage[]
): RedFlag[] {
  const flags: RedFlag[] = [];
  const genderLabel = otherGender === "female" ? "Elle" : "Il";

  const ratio =
    you.totalMessages > 0 ? other.totalMessages / you.totalMessages : 0;

  if (ratio < 0.4) {
    flags.push({
      id: "effort-imbalance",
      title: "Déséquilibre d'effort",
      description: `Tu envoies ${Math.round((1 / ratio) * 10) / 10}x plus de messages que ${genderLabel.toLowerCase()}. ${genderLabel} ne fait pas le même effort.`,
      severity: "high",
      icon: "⚖️",
      score: 85,
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

  if (other.avgResponseTimeMin > you.avgResponseTimeMin * 3 && other.avgResponseTimeMin > 60) {
    flags.push({
      id: "slow-replies",
      title: `${genderLabel} met du temps à répondre`,
      description: `${genderLabel} répond en moyenne en ${other.avgResponseTimeMin} min vs toi en ${you.avgResponseTimeMin} min. ${other.avgResponseTimeMin > 180 ? "C'est un signe de désintérêt potentiel." : ""}`,
      severity: other.avgResponseTimeMin > 180 ? "high" : "medium",
      icon: "🐌",
      score: other.avgResponseTimeMin > 180 ? 80 : 50,
    });
  }

  if (other.avgWordsPerMessage < 4 && you.avgWordsPerMessage > 8) {
    flags.push({
      id: "short-replies",
      title: "Réponses ultra-courtes",
      description: `${genderLabel} envoie en moyenne ${other.avgWordsPerMessage} mots/message vs toi ${you.avgWordsPerMessage}. ${genderLabel} fait le minimum.`,
      severity: "high",
      icon: "📝",
      score: 75,
    });
  }

  if (you.doubleTexts + you.tripleTexts > 20 && other.doubleTexts + other.tripleTexts < 5) {
    flags.push({
      id: "double-texting",
      title: "Tu relances trop",
      description: `Tu envoies des messages sans réponse ${you.doubleTexts + you.tripleTexts} fois. ${genderLabel} le fait seulement ${other.doubleTexts + other.tripleTexts} fois.`,
      severity: "medium",
      icon: "📱",
      score: 60,
    });
  }

  if (other.ghostCount > 5) {
    flags.push({
      id: "ghosting",
      title: "Ghosting fréquent",
      description: `${genderLabel} a disparu pendant plus de 24h au moins ${other.ghostCount} fois dans cette conversation.`,
      severity: other.ghostCount > 15 ? "critical" : "high",
      icon: "👻",
      score: other.ghostCount > 15 ? 95 : 70,
    });
  }

  if (you.initiations > other.initiations * 2.5 && you.initiations > 10) {
    flags.push({
      id: "always-initiating",
      title: "Tu commences toujours la conversation",
      description: `Tu inities la conversation ${you.initiations} fois vs ${genderLabel.toLowerCase()} ${other.initiations} fois. ${genderLabel} ne prend jamais l'initiative.`,
      severity: "high",
      icon: "🚩",
      score: 80,
    });
  }

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

  if (other.loveCount === 0 && you.loveCount > 5) {
    flags.push({
      id: "no-love",
      title: "Zéro affection",
      description: `Tu envoies ${you.loveCount} messages affectueux. ${genderLabel} : 0. Aucune réciprocité émotionnelle.`,
      severity: "high",
      icon: "💔",
      score: 85,
    });
  }

  const otherLateNight = other.messagesByHour
    .slice(23)
    .concat(other.messagesByHour.slice(0, 5))
    .reduce((a, b) => a + b, 0);
  const otherDaytime = other.messagesByHour
    .slice(8, 20)
    .reduce((a, b) => a + b, 0);

  if (
    otherLateNight > otherDaytime * 0.5 &&
    otherLateNight > 20
  ) {
    flags.push({
      id: "late-night-only",
      title: "Messages uniquement la nuit",
      description: `${genderLabel} t'écrit surtout entre 23h et 5h. Tu es peut-être un plan B nocturne.`,
      severity: "medium",
      icon: "🌙",
      score: 65,
    });
  }

  if (other.totalQuestions < you.totalQuestions * 0.3 && you.totalQuestions > 10) {
    flags.push({
      id: "no-curiosity",
      title: `${genderLabel} ne te pose jamais de questions`,
      description: `Tu poses ${you.totalQuestions} questions vs ${genderLabel.toLowerCase()} seulement ${other.totalQuestions}. ${genderLabel} ne s'intéresse pas à ta vie.`,
      severity: "medium",
      icon: "❓",
      score: 60,
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
  otherGender: Gender
): { verdict: string; emoji: string } {
  const maxSeverity = redFlags.length
    ? Math.max(...redFlags.map((f) => f.score))
    : 0;
  const avgScore = redFlags.length
    ? redFlags.reduce((s, f) => s + f.score, 0) / redFlags.length
    : 0;
  const genderLabel = otherGender === "female" ? "elle" : "il";

  if (redFlags.length === 0 && greenFlags.length >= 3) {
    return { verdict: `C'est du solide ! ${otherGender === "female" ? "Elle" : "Il"} est investi(e) autant que toi. Cette connexion est réelle.`, emoji: "💚" };
  }
  if (redFlags.length <= 1 && greenFlags.length >= 2) {
    return { verdict: `Globalement positif. Quelques points d'attention mais ${genderLabel} semble sincère.`, emoji: "💛" };
  }
  if (avgScore > 75) {
    return { verdict: `Attention ! Trop de red flags. ${otherGender === "female" ? "Elle" : "Il"} ne fait pas le même effort que toi. Tu mérites mieux.`, emoji: "🚩" };
  }
  if (avgScore > 50) {
    return { verdict: `Zone grise. ${otherGender === "female" ? "Elle" : "Il"} montre des signes mitigés. Observe bien avant de t'investir davantage.`, emoji: "🟡" };
  }
  if (maxSeverity > 80) {
    return { verdict: `Red flag critique détecté. ${otherGender === "female" ? "Elle" : "Il"} ne te traite pas comme tu le mérites.`, emoji: "❌" };
  }
  return { verdict: `Résultats mixtes. Prends du recul et observe les prochaines semaines.`, emoji: "🤔" };
}

export function analyzeChat(
  parsed: ParsedChat,
  youName: string,
  otherName: string,
  otherGender: Gender
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

  const redFlags = detectRedFlags(you, other, otherGender, parsed.messages);
  const greenFlags = detectGreenFlags(you, other, otherGender);
  const { verdict, emoji: verdictEmoji } = generateVerdict(redFlags, greenFlags, otherGender);

  const interestScore = Math.max(0, Math.min(100, effortScore + greenFlags.length * 8 - redFlags.length * 12));
  const toxicityScore = Math.min(100, redFlags.reduce((s, f) => s + f.score, 0) / Math.max(1, redFlags.length));
  const compatibilityScore = Math.max(0, Math.min(100, 
    50 + greenFlags.length * 10 - redFlags.length * 8 + (ratio > 0.7 && ratio < 1.4 ? 15 : -10)
  ));

  return {
    you,
    other,
    otherGender,
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
