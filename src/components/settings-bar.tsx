"use client";

import {
  STORY_MODELS,
  EFFORT_LEVELS,
  TTS_ENGINES,
  ELEVENLABS_VOICES,
  GEMINI_TTS_VOICES,
  type StoryModel,
  type EffortLevel,
  type TtsEngine,
} from "@/lib/types";

interface SettingsBarProps {
  model: StoryModel;
  effort: EffortLevel;
  ttsEngine: TtsEngine;
  voiceId: string;
  onModelChange: (model: StoryModel) => void;
  onEffortChange: (effort: EffortLevel) => void;
  onTtsEngineChange: (engine: TtsEngine) => void;
  onVoiceChange: (voiceId: string) => void;
}

export function SettingsBar({
  model,
  effort,
  ttsEngine,
  voiceId,
  onModelChange,
  onEffortChange,
  onTtsEngineChange,
  onVoiceChange,
}: SettingsBarProps) {
  const voices = ttsEngine === "gemini" ? GEMINI_TTS_VOICES : ELEVENLABS_VOICES;

  return (
    <div className="flex flex-wrap gap-4 items-center bg-night-800/50 rounded-xl p-4 border border-night-600/30">
      <span className="text-gold-400 font-bold text-sm">הגדרות</span>

      <div className="flex items-center gap-2">
        <label htmlFor="model" className="text-sm text-gray-300">מודל:</label>
        <select
          id="model"
          value={model}
          onChange={(e) => onModelChange(e.target.value as StoryModel)}
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {STORY_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="effort" className="text-sm text-gray-300">חשיבה:</label>
        <select
          id="effort"
          value={effort}
          onChange={(e) => onEffortChange(e.target.value as EffortLevel)}
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {EFFORT_LEVELS
            .filter((e) => e.value !== "max" || !model.startsWith("gemini-"))
            .map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="ttsEngine" className="text-sm text-gray-300">TTS:</label>
        <select
          id="ttsEngine"
          value={ttsEngine}
          onChange={(e) => {
            const engine = e.target.value as TtsEngine;
            onTtsEngineChange(engine);
            // Auto-select first voice of new engine
            const newVoices = engine === "gemini" ? GEMINI_TTS_VOICES : ELEVENLABS_VOICES;
            onVoiceChange(newVoices[0].value);
          }}
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {TTS_ENGINES.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="voice" className="text-sm text-gray-300">קול:</label>
        <select
          id="voice"
          value={voiceId}
          onChange={(e) => onVoiceChange(e.target.value)}
          className="bg-night-700 border border-night-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
        >
          {voices.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
