export type SourceType = "tanakh" | "gmara" | "zohar" | "midrash" | "other";

export type ClaudeModel = "claude-sonnet-4-6" | "claude-opus-4-6";

export type EffortLevel = "low" | "medium" | "high" | "max";

export const CLAUDE_MODELS: { value: ClaudeModel; label: string }[] = [
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6 (מהיר)" },
  { value: "claude-opus-4-6", label: "Opus 4.6 (מתקדם)" },
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
  model: ClaudeModel;
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
