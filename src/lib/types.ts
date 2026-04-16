export type SourceType = "tanakh" | "gmara" | "zohar" | "midrash" | "other";

export type ClaudeModel = "claude-sonnet-4-6" | "claude-opus-4-7";
export type GeminiModel = "gemini-3.1-flash-lite-preview" | "gemini-3.1-pro-preview";
export type StoryModel = ClaudeModel | GeminiModel;

export type EffortLevel = "low" | "medium" | "high" | "max";

export type TtsEngine = "elevenlabs" | "gemini";

export const STORY_MODELS: { value: StoryModel; label: string }[] = [
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
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

export const TTS_ENGINES: { value: TtsEngine; label: string }[] = [
  { value: "gemini", label: "Gemini 3.1 TTS" },
  { value: "elevenlabs", label: "ElevenLabs" },
];

export const ELEVENLABS_VOICES: { value: string; label: string }[] = [
  { value: "owHnXhz2H7U5Cv31srDU", label: "קול 1" },
  { value: "JiKFunrRggP9Jl3AcoUw", label: "קול 2" },
];

export const GEMINI_TTS_VOICES: { value: string; label: string }[] = [
  // Female voices
  { value: "Aoede", label: "Aoede (נשי, קליל)" },
  { value: "Kore", label: "Kore (נשי, יציב)" },
  { value: "Leda", label: "Leda (נשי, צעיר)" },
  { value: "Zephyr", label: "Zephyr (נשי, בהיר)" },
  { value: "Achernar", label: "Achernar (נשי, רך)" },
  { value: "Sulafat", label: "Sulafat (נשי, חם)" },
  { value: "Vindemiatrix", label: "Vindemiatrix (נשי, עדין)" },
  { value: "Despina", label: "Despina (נשי, חלק)" },
  { value: "Achird", label: "Achird (נשי, ידידותי)" },
  { value: "Sadachbia", label: "Sadachbia (נשי, חיוני)" },
  // Male voices
  { value: "Puck", label: "Puck (גברי, עליז)" },
  { value: "Charon", label: "Charon (גברי, מידעי)" },
  { value: "Fenrir", label: "Fenrir (גברי, נלהב)" },
  { value: "Orus", label: "Orus (גברי, יציב)" },
  { value: "Iapetus", label: "Iapetus (גברי, צלול)" },
  { value: "Umbriel", label: "Umbriel (גברי, קליל)" },
  { value: "Algieba", label: "Algieba (גברי, חלק)" },
  { value: "Gacrux", label: "Gacrux (גברי, בוגר)" },
  { value: "Schedar", label: "Schedar (גברי, אחיד)" },
  { value: "Algenib", label: "Algenib (גברי, חספוס)" },
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
  ttsEngine: TtsEngine;
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
