export type SourceType = "tanakh" | "gmara" | "zohar" | "midrash" | "other";

export type ClaudeModel = "claude-sonnet-4-6" | "claude-opus-4-6";
export type GeminiModel = "gemini-3.1-flash-lite-preview" | "gemini-3.1-pro-preview";
export type StoryModel = ClaudeModel | GeminiModel;

export type EffortLevel = "low" | "medium" | "high" | "max";

export const STORY_MODELS: { value: StoryModel; label: string }[] = [
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
];

export const EFFORT_LEVELS: { value: EffortLevel; label: string }[] = [
  { value: "low", label: "נמוך" },
  { value: "medium", label: "בינוני" },
  { value: "high", label: "גבוה" },
  { value: "max", label: "מקסימלי" },
];

export const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "tanakh", label: 'תנ"ך' },
  { value: "gmara", label: "גמרא" },
  { value: "zohar", label: "זוהר" },
  { value: "midrash", label: "מדרש" },
  { value: "other", label: "אחר" },
];

// ElevenLabs Hebrew-compatible voices
// These are default ElevenLabs voices - user can find voice IDs from their library
export const TTS_VOICES: { value: string; label: string }[] = [
  { value: "JiKFunrRggP9Jl3AcoUw", label: "ברירת מחדל" },
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
  model: StoryModel;
  effort: EffortLevel;
  voiceId: string;
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
