export type SourceType = "tanakh" | "gmara" | "zohar" | "midrash" | "other";

export type GeminiModel = "gemini-3.1-flash" | "gemini-3.1-pro";

export type ThinkingLevel = "none" | "low" | "medium" | "high";

export const GEMINI_MODELS: { value: GeminiModel; label: string }[] = [
  { value: "gemini-3.1-flash", label: "Flash (מהיר)" },
  { value: "gemini-3.1-pro", label: "Pro (מתקדם)" },
];

export const THINKING_LEVELS: { value: ThinkingLevel; label: string }[] = [
  { value: "none", label: "ללא" },
  { value: "low", label: "נמוך" },
  { value: "medium", label: "בינוני" },
  { value: "high", label: "גבוה" },
];

export const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "tanakh", label: 'תנ"ך' },
  { value: "gmara", label: "גמרא" },
  { value: "zohar", label: "זוהר" },
  { value: "midrash", label: "מדרש" },
  { value: "other", label: "אחר" },
];

export const TTS_VOICES: { value: string; label: string }[] = [
  { value: "Kore", label: "Kore (יציב)" },
  { value: "Leda", label: "Leda (צעיר)" },
  { value: "Enceladus", label: "Enceladus (רך)" },
  { value: "Aoede", label: "Aoede (חם)" },
  { value: "Puck", label: "Puck (עליז)" },
  { value: "Charon", label: "Charon (מידעי)" },
];

export interface StoryData {
  id?: string;
  slug?: string;
  title?: string;
  sourceType: SourceType;
  originalText: string;
  childrenStory?: string;
  ttsScript?: string;
  audioUrl?: string;
  model: GeminiModel;
  thinkingLevel: ThinkingLevel;
  voiceName: string;
}

export interface SavedStory {
  id: string;
  slug: string;
  title: string | null;
  sourceType: SourceType;
  originalText: string;
  childrenStory: string | null;
  ttsScript: string | null;
  hasAudio: boolean;
  model: string;
  thinkingLevel: string | null;
  createdAt: string;
}
