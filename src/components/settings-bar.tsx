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

const SELECT_CLASS =
  "w-full bg-paper-2 border border-rule rounded-md px-2.5 py-1.5 text-ink text-sm focus:outline-none focus:border-brass transition-colors";

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
    <div className="bg-paper border border-rule rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <SettingField label="מודל">
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value as StoryModel)}
          className={SELECT_CLASS}
        >
          {STORY_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </SettingField>

      <SettingField label="חשיבה">
        <select
          value={effort}
          onChange={(e) => onEffortChange(e.target.value as EffortLevel)}
          className={SELECT_CLASS}
        >
          {EFFORT_LEVELS.filter(
            (e) => e.value !== "max" || !model.startsWith("gemini-"),
          ).map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </SettingField>

      <SettingField label="הקראה">
        <select
          value={ttsEngine}
          onChange={(e) => {
            const engine = e.target.value as TtsEngine;
            onTtsEngineChange(engine);
            const newVoices =
              engine === "gemini" ? GEMINI_TTS_VOICES : ELEVENLABS_VOICES;
            onVoiceChange(newVoices[0].value);
          }}
          className={SELECT_CLASS}
        >
          {TTS_ENGINES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </SettingField>

      <SettingField label="קול">
        <select
          value={voiceId}
          onChange={(e) => onVoiceChange(e.target.value)}
          className={SELECT_CLASS}
        >
          {voices.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </SettingField>
    </div>
  );
}

function SettingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
