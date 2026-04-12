"use client";

import { useState, useCallback } from "react";
import { SettingsBar } from "./settings-bar";
import { SourceInput } from "./source-input";
import { StepSection } from "./step-section";
import { AudioPlayer, type SoundEffectData } from "./audio-player";
import { StoryActions } from "./story-actions";
import { SavedStoriesList } from "./saved-stories-list";
import type { GeminiModel, ThinkingLevel, SourceType, SavedStory } from "@/lib/types";

export function StoryWizard() {
  // Settings
  const [model, setModel] = useState<GeminiModel>("gemini-3.1-flash-lite-preview");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("none");
  const [voiceName, setVoiceName] = useState("Aoede");
  const [sourceType, setSourceType] = useState<SourceType>("tanakh");

  // Content
  const [originalText, setOriginalText] = useState("");
  const [childrenStory, setChildrenStory] = useState("");
  const [ttsScript, setTtsScript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Sound design
  const [ambientUrl, setAmbientUrl] = useState<string | null>(null);
  const [soundEffects, setSoundEffects] = useState<SoundEffectData[]>([]);
  const [isGeneratingSounds, setIsGeneratingSounds] = useState(false);

  // Loading states
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isSpellchecking, setIsSpellchecking] = useState(false);
  const [isGeneratingDirections, setIsGeneratingDirections] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Saved story state
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const generateStory = useCallback(async () => {
    clearError();
    setIsGeneratingStory(true);
    try {
      const res = await fetch("/api/generate/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText, sourceType, model, thinkingLevel }),
      });
      if (!res.ok) throw new Error("Failed to generate story");
      const data = await res.json();
      setChildrenStory(data.childrenStory);
      setTtsScript("");
      setAudioUrl(null);
      setAudioBase64(null);
            setAmbientUrl(null);
      setSoundEffects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת הסיפור");
    } finally {
      setIsGeneratingStory(false);
    }
  }, [originalText, sourceType, model, thinkingLevel]);

  const spellcheck = useCallback(async () => {
    clearError();
    setIsSpellchecking(true);
    try {
      const res = await fetch("/api/generate/spellcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childrenStory, model, thinkingLevel }),
      });
      if (!res.ok) throw new Error("Failed to spellcheck");
      const data = await res.json();
      setChildrenStory(data.correctedStory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בבדיקת דקדוק");
    } finally {
      setIsSpellchecking(false);
    }
  }, [childrenStory, model, thinkingLevel]);

  const generateDirections = useCallback(async () => {
    clearError();
    setIsGeneratingDirections(true);
    try {
      const res = await fetch("/api/generate/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childrenStory, model, thinkingLevel }),
      });
      if (!res.ok) throw new Error("Failed to generate directions");
      const data = await res.json();
      setTtsScript(data.ttsScript);
      setAudioUrl(null);
      setAudioBase64(null);
            setAmbientUrl(null);
      setSoundEffects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת ההנחיות");
    } finally {
      setIsGeneratingDirections(false);
    }
  }, [childrenStory, model, thinkingLevel]);

  const generateAudio = useCallback(async () => {
    clearError();
    setIsGeneratingAudio(true);
    try {
      const res = await fetch("/api/generate/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsScript, voiceName }),
      });
      if (!res.ok) throw new Error("Failed to generate audio");
      const data = await res.json();
      setAudioBase64(data.audioBase64);
      const blob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
        { type: data.mimeType }
      );
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת ההקראה");
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [ttsScript, voiceName]);

  const generateSounds = useCallback(async () => {
    clearError();
    setIsGeneratingSounds(true);
    try {
      const res = await fetch("/api/generate/sounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsScript }),
      });
      if (!res.ok) throw new Error("Failed to generate sounds");
      const data = await res.json();

      // Convert base64 to blob URLs
      const ambientBlob = new Blob(
        [Uint8Array.from(atob(data.ambientBase64), (c) => c.charCodeAt(0))],
        { type: data.mimeType }
      );
      setAmbientUrl(URL.createObjectURL(ambientBlob));

      const effects: SoundEffectData[] = data.effects.map(
        (e: { label: string; position: number; audioBase64: string }) => {
          const blob = new Blob(
            [Uint8Array.from(atob(e.audioBase64), (c) => c.charCodeAt(0))],
            { type: data.mimeType }
          );
          return {
            label: e.label,
            timestampSeconds: null,
            fallbackPosition: e.position,
            audioUrl: URL.createObjectURL(blob),
          };
        }
      );
      setSoundEffects(effects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת צלילים");
    } finally {
      setIsGeneratingSounds(false);
    }
  }, [ttsScript, audioBase64]);

  const handleSaved = (id: string, slug: string) => {
    setCurrentStoryId(id);
    setCurrentSlug(slug);
  };

  const handleLoadStory = async (story: SavedStory) => {
    setOriginalText(story.originalText);
    setSourceType(story.sourceType);
    setChildrenStory(story.childrenStory || "");
    setTtsScript(story.ttsScript || "");
    setCurrentStoryId(story.id);
    setCurrentSlug(story.slug);
    setModel((story.model as GeminiModel) || "gemini-3.1-flash-lite-preview");
    setThinkingLevel((story.thinkingLevel as ThinkingLevel) || "none");
        setAmbientUrl(null);
    setSoundEffects([]);

    if (story.hasAudio) {
      try {
        const res = await fetch(`/api/stories/${story.id}/audio`);
        if (res.ok) {
          const blob = await res.blob();
          setAudioUrl(URL.createObjectURL(blob));
        }
      } catch {
        // Audio load failed, continue without it
      }
    } else {
      setAudioUrl(null);
      setAudioBase64(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsBar
        model={model}
        thinkingLevel={thinkingLevel}
        voiceName={voiceName}
        onModelChange={setModel}
        onThinkingLevelChange={setThinkingLevel}
        onVoiceChange={setVoiceName}
      />

      <SourceInput
        originalText={originalText}
        sourceType={sourceType}
        onTextChange={setOriginalText}
        onSourceTypeChange={setSourceType}
      />

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <StepSection
        stepNumber={1}
        title="סיפור ילדים"
        buttonLabel="המר לסיפור"
        isLoading={isGeneratingStory}
        isDisabled={!originalText.trim()}
        onGenerate={generateStory}
        value={childrenStory}
        onChange={setChildrenStory}
      >
        {childrenStory && (
          <button
            onClick={spellcheck}
            disabled={isSpellchecking}
            className="px-4 py-1.5 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-sm text-gray-300 rounded-lg transition-colors flex items-center gap-2 border border-night-600/50"
          >
            {isSpellchecking && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSpellchecking ? "בודק..." : "בדוק דקדוק"}
          </button>
        )}
      </StepSection>

      <StepSection
        stepNumber={2}
        title="הנחיות הקראה"
        buttonLabel="הכן להקראה"
        isLoading={isGeneratingDirections}
        isDisabled={!childrenStory.trim()}
        onGenerate={generateDirections}
        value={ttsScript}
        onChange={setTtsScript}
      />

      <StepSection
        stepNumber={3}
        title="הקראה וצלילים"
        buttonLabel="הקרא את הסיפור"
        isLoading={isGeneratingAudio}
        isDisabled={!ttsScript.trim()}
        onGenerate={generateAudio}
        value=""
        onChange={() => {}}
      >
        {audioUrl && !ambientUrl && (
          <button
            onClick={generateSounds}
            disabled={isGeneratingSounds}
            className="px-4 py-1.5 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-sm text-gray-300 rounded-lg transition-colors flex items-center gap-2 border border-night-600/50"
          >
            {isGeneratingSounds && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isGeneratingSounds ? "מייצר צלילים..." : "ייצר מוזיקה ואווירה"}
          </button>
        )}
        <AudioPlayer
          audioUrl={audioUrl}
          ambientUrl={ambientUrl}
          effects={soundEffects}
          isLoading={isGeneratingAudio}
        />
      </StepSection>

      <StoryActions
        storyData={{
          id: currentStoryId || undefined,
          slug: currentSlug || undefined,
          sourceType,
          originalText,
          childrenStory: childrenStory || undefined,
          ttsScript: ttsScript || undefined,
          model,
          thinkingLevel,
          voiceName,
        }}
        audioBase64={audioBase64}
        onSaved={handleSaved}
      />

      <SavedStoriesList onLoad={handleLoadStory} />
    </div>
  );
}
