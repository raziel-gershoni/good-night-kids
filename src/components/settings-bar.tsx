"use client";

import {
  GEMINI_MODELS,
  THINKING_LEVELS,
  TTS_VOICES,
  type GeminiModel,
  type ThinkingLevel,
} from "@/lib/types";

interface SettingsBarProps {
  model: GeminiModel;
  thinkingLevel: ThinkingLevel;
  voiceName: string;
  onModelChange: (model: GeminiModel) => void;
  onThinkingLevelChange: (level: ThinkingLevel) => void;
  onVoiceChange: (voice: string) => void;
}

export function SettingsBar({
  model,
  thinkingLevel,
  voiceName,
  onModelChange,
  onThinkingLevelChange,
  onVoiceChange,
}: SettingsBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center bg-night-800/50 rounded-xl p-4 border border-night-600/30">
      <span className="text-gold-400 font-bold text-sm">הגדרות</span>

      <div className="flex items-center gap-2">
        <label htmlFor="model" className="text-sm text-gray-300">
          מודל:
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => onModelChange(e.target.value as GeminiModel)}
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="thinking" className="text-sm text-gray-300">
          חשיבה:
        </label>
        <select
          id="thinking"
          value={thinkingLevel}
          onChange={(e) =>
            onThinkingLevelChange(e.target.value as ThinkingLevel)
          }
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {THINKING_LEVELS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="voice" className="text-sm text-gray-300">
          קול:
        </label>
        <select
          id="voice"
          value={voiceName}
          onChange={(e) => onVoiceChange(e.target.value)}
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {TTS_VOICES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
