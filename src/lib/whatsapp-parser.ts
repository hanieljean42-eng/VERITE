export interface WhatsAppMessage {
  date: Date;
  time: string;
  sender: string;
  text: string;
  isMedia: boolean;
  isDeleted: boolean;
  wordCount: number;
  charCount: number;
  emojiCount: number;
  emojis: string[];
  hasQuestion: boolean;
  hasExclamation: boolean;
  hasLink: boolean;
  isLaugh: boolean;
  isLove: boolean;
}

export interface ParsedChat {
  messages: WhatsAppMessage[];
  participants: string[];
  you: string;
  other: string;
}

const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;

const LAUGH_PATTERNS =
  /\b(haha|hehe|hihi|lol|lmao|lmfao|mdr|ptdr|xd|😂|🤣|😆|💀)\b/gi;

const LOVE_PATTERNS =
  /\b(love|aime|amour|coeur|bisou|kiss|babe|bébé|chéri|chérie|mon cœur|❤️|💕|💖|💗|💘|💝|😍|🥰|😘|💋|❣️|💞)\b/gi;

const LINK_REGEX = /https?:\/\/[^\s]+/gi;

// WhatsApp export formats:
// [DD/MM/YYYY, HH:MM:SS] Sender: Message
// [DD/MM/YYYY à HH:MM:SS] Sender: Message  
// DD/MM/YYYY, HH:MM - Sender: Message
// [MM/DD/YY, HH:MM:SS AM/PM] Sender: Message
const LINE_REGEX =
  /^(?:\[?)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s,àa]*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?)(?:\]?\s*[-–]?\s*)([^:]+?):\s(.+)$/;

function extractEmojis(text: string): string[] {
  return text.match(EMOJI_REGEX) || [];
}

export function parseWhatsAppExport(content: string): ParsedChat {
  // Remove BOM and normalize line endings
  const cleaned = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n");
  const messages: WhatsAppMessage[] = [];
  const participantSet = new Set<string>();

  let currentMessage: WhatsAppMessage | null = null;

  for (const line of lines) {
    const match = line.match(LINE_REGEX);

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, dateStr, timeStr, sender, text] = match;
      const trimmedSender = sender.trim();
      participantSet.add(trimmedSender);

      const dateParts = dateStr.split(/[\/\-\.]/);
      let day: number, month: number, year: number;

      if (parseInt(dateParts[0]) > 12) {
        day = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]) - 1;
      } else if (parseInt(dateParts[1]) > 12) {
        month = parseInt(dateParts[0]) - 1;
        day = parseInt(dateParts[1]);
      } else {
        day = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]) - 1;
      }

      year = parseInt(dateParts[2]);
      if (year < 100) year += 2000;

      const date = new Date(year, month, day);
      const emojis = extractEmojis(text);
      const isMedia =
        text.includes("<Médias omis>") ||
        text.includes("<Media omitted>") ||
        text.includes("image omise") ||
        text.includes("vidéo omise") ||
        text.includes("sticker omis") ||
        text.includes("audio omis") ||
        text.includes("GIF omis");

      const isDeleted =
        text.includes("Ce message a été supprimé") ||
        text.includes("This message was deleted") ||
        text.includes("Vous avez supprimé ce message") ||
        text.includes("You deleted this message");

      currentMessage = {
        date,
        time: timeStr.trim(),
        sender: trimmedSender,
        text: text.trim(),
        isMedia,
        isDeleted,
        wordCount: isMedia || isDeleted ? 0 : text.trim().split(/\s+/).length,
        charCount: isMedia || isDeleted ? 0 : text.trim().length,
        emojiCount: emojis.length,
        emojis,
        hasQuestion: text.includes("?"),
        hasExclamation: text.includes("!"),
        hasLink: LINK_REGEX.test(text),
        isLaugh: LAUGH_PATTERNS.test(text),
        isLove: LOVE_PATTERNS.test(text),
      };
    } else if (currentMessage && line.trim()) {
      // Multi-line message continuation
      currentMessage.text += "\n" + line.trim();
      currentMessage.wordCount += line.trim().split(/\s+/).length;
      currentMessage.charCount += line.trim().length;
      const emojis = extractEmojis(line);
      currentMessage.emojiCount += emojis.length;
      currentMessage.emojis.push(...emojis);
      if (line.includes("?")) currentMessage.hasQuestion = true;
      if (line.includes("!")) currentMessage.hasExclamation = true;
      if (LINK_REGEX.test(line)) currentMessage.hasLink = true;
      if (LAUGH_PATTERNS.test(line)) currentMessage.isLaugh = true;
      if (LOVE_PATTERNS.test(line)) currentMessage.isLove = true;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  const participants = Array.from(participantSet);

  return {
    messages,
    participants,
    you: participants[0] || "Vous",
    other: participants[1] || "Autre",
  };
}
