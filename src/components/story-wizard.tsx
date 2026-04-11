"use client";

import { useState, useCallback } from "react";
import { SettingsBar } from "./settings-bar";
import { SourceInput } from "./source-input";
import { StepSection } from "./step-section";
import { AudioPlayer } from "./audio-player";
import { StoryActions } from "./story-actions";
import { SavedStoriesList } from "./saved-stories-list";
import type { GeminiModel, ThinkingLevel, SourceType, SavedStory } from "@/lib/types";

export function StoryWizard() {
  // Settings
  const [model, setModel] = useState<GeminiModel>("gemini-2.5-flash");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("none");
  const [voiceName, setVoiceName] = useState("Kore");
  const [sourceType, setSourceType] = useState<SourceType>("tanakh");

  // Content
  const [originalText, setOriginalText] = useState("");
  const [childrenStory, setChildrenStory] = useState("");
  const [ttsScript, setTtsScript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Loading states
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת הסיפור");
    } finally {
      setIsGeneratingStory(false);
    }
  }, [originalText, sourceType, model, thinkingLevel]);

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
    setModel((story.model as GeminiModel) || "gemini-2.5-flash");
    setThinkingLevel((story.thinkingLevel as ThinkingLevel) || "none");

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
      />

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
        title="הקראה"
        buttonLabel="הקרא את הסיפור"
        isLoading={isGeneratingAudio}
        isDisabled={!ttsScript.trim()}
        onGenerate={generateAudio}
        value=""
        onChange={() => {}}
      >
        <AudioPlayer audioUrl={audioUrl} isLoading={isGeneratingAudio} />
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
