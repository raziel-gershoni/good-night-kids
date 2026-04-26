"use client";

import { useState, useCallback } from "react";
import { SettingsBar } from "./settings-bar";
import { SourceInput } from "./source-input";
import { StepSection } from "./step-section";
import { AudioPlayer } from "./audio-player";
import { StoryActions } from "./story-actions";
import { SavedStoriesList } from "./saved-stories-list";
import { Button } from "./ui";
import type {
  StoryModel,
  EffortLevel,
  TtsEngine,
  SourceType,
  SavedStory,
} from "@/lib/types";
import { audioBufferToWav } from "@/lib/audio-utils";

export function StoryWizard() {
  // Settings
  const [model, setModel] = useState<StoryModel>(
    "gemini-3.1-flash-lite-preview",
  );
  const [effort, setEffort] = useState<EffortLevel>("high");
  const [ttsEngine, setTtsEngine] = useState<TtsEngine>("gemini");
  const [voiceId, setVoiceId] = useState("Aoede");
  const [sourceType, setSourceType] = useState<SourceType>("tanakh");

  // Content
  const [originalText, setOriginalText] = useState("");
  const [childrenStory, setChildrenStory] = useState("");
  const [ttsScript, setTtsScript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Sound design
  const [ambientPrompt, setAmbientPrompt] = useState("");
  const [ambientBlob, setAmbientBlob] = useState<string | null>(null);
  const [isMixed, setIsMixed] = useState(false);

  // Loading states
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isVocalizing, setIsVocalizing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingSoundDesign, setIsGeneratingSoundDesign] = useState(false);
  const [isGeneratingAmbient, setIsGeneratingAmbient] = useState(false);
  const [isMixing, setIsMixing] = useState(false);

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
        body: JSON.stringify({ originalText, sourceType, model, effort }),
      });
      if (!res.ok) throw new Error("Failed to generate story");
      const data = await res.json();
      setChildrenStory(data.childrenStory);
      setTtsScript("");
      setAudioUrl(null);
      setAudioBase64(null);
      setIsMixed(false);
      setAmbientBlob(null);
      setAmbientPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת הסיפור");
    } finally {
      setIsGeneratingStory(false);
    }
  }, [originalText, sourceType, model, effort]);

  const vocalize = useCallback(async () => {
    clearError();
    setIsVocalizing(true);
    try {
      const res = await fetch("/api/generate/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childrenStory }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to vocalize");
      }
      const data = await res.json();
      setChildrenStory(data.ttsScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בניקוד הטקסט");
    } finally {
      setIsVocalizing(false);
    }
  }, [childrenStory]);

  const generateSoundDesign = useCallback(async () => {
    clearError();
    setIsGeneratingSoundDesign(true);
    try {
      const res = await fetch("/api/generate/sound-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childrenStory }),
      });
      if (!res.ok) throw new Error("Failed to generate sound design");
      const data = await res.json();
      setAmbientPrompt(data.ambient || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "שגיאה ביצירת עיצוב סאונד",
      );
    } finally {
      setIsGeneratingSoundDesign(false);
    }
  }, [childrenStory]);

  const generateAudio = useCallback(async () => {
    clearError();
    setIsGeneratingAudio(true);
    setIsMixed(false);
    try {
      const res = await fetch("/api/generate/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsScript: childrenStory, voiceId, ttsEngine }),
      });
      if (!res.ok) throw new Error("Failed to generate audio");
      const data = await res.json();
      setAudioBase64(data.audioBase64);
      const blob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
        { type: data.mimeType },
      );
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת ההקראה");
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [childrenStory, voiceId, ttsEngine]);

  const generateAmbient = useCallback(async () => {
    if (!ambientPrompt.trim()) return;
    clearError();
    setIsGeneratingAmbient(true);
    try {
      const res = await fetch("/api/generate/sounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ambient", ambientPrompt }),
      });
      if (!res.ok) throw new Error("Failed to generate ambient");
      const data = await res.json();
      if (data.audioBase64) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
          { type: data.mimeType },
        );
        setAmbientBlob(URL.createObjectURL(blob));
        setIsMixed(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת אווירה");
    } finally {
      setIsGeneratingAmbient(false);
    }
  }, [ambientPrompt]);

  const mixAll = useCallback(async () => {
    if (!audioBase64) return;
    clearError();
    setIsMixing(true);
    try {
      const narBytes = Uint8Array.from(atob(audioBase64), (c) =>
        c.charCodeAt(0),
      );
      const tempCtx = new AudioContext();
      const narBuf = await tempCtx.decodeAudioData(narBytes.buffer.slice(0));
      await tempCtx.close();

      const sampleRate = narBuf.sampleRate;
      const fadeout = 4;
      const narDuration = narBuf.length / sampleRate;
      const totalLength = narBuf.length + fadeout * sampleRate;
      const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);

      const narSrc = offlineCtx.createBufferSource();
      narSrc.buffer = narBuf;
      narSrc.connect(offlineCtx.destination);
      narSrc.start(0);

      if (ambientBlob) {
        const ambResp = await fetch(ambientBlob);
        const ambBuf = await offlineCtx.decodeAudioData(
          await ambResp.arrayBuffer(),
        );
        const ambGain = offlineCtx.createGain();
        ambGain.gain.setValueAtTime(0.5, 0);
        ambGain.gain.setValueAtTime(0.5, narDuration);
        ambGain.gain.linearRampToValueAtTime(0, narDuration + fadeout);
        const loops = Math.ceil(totalLength / ambBuf.length);
        for (let i = 0; i < loops; i++) {
          const src = offlineCtx.createBufferSource();
          src.buffer = ambBuf;
          src.connect(ambGain).connect(offlineCtx.destination);
          src.start((i * ambBuf.length) / sampleRate);
        }
      }

      const rendered = await offlineCtx.startRendering();
      const wavData = audioBufferToWav(rendered);
      const mixedUrl = URL.createObjectURL(
        new Blob([wavData], { type: "audio/wav" }),
      );
      setAudioUrl(mixedUrl);
      setIsMixed(true);
    } catch (err) {
      console.error("Mix error:", err);
      setError(err instanceof Error ? err.message : "שגיאה במיקס");
    } finally {
      setIsMixing(false);
    }
  }, [audioBase64, ambientBlob]);

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
    setModel((story.model as StoryModel) || "claude-sonnet-4-6");
    setIsMixed(false);
    setAmbientBlob(null);

    if (story.hasAudio) {
      try {
        const res = await fetch(`/api/stories/${story.id}/audio`);
        if (res.ok) {
          const blob = await res.blob();
          setAudioUrl(URL.createObjectURL(blob));
        }
      } catch {
        /* ignore */
      }
    } else {
      setAudioUrl(null);
      setAudioBase64(null);
    }
    void ttsScript;
  };

  return (
    <div className="space-y-10">
      <SettingsBar
        model={model}
        effort={effort}
        ttsEngine={ttsEngine}
        voiceId={voiceId}
        onModelChange={setModel}
        onEffortChange={setEffort}
        onTtsEngineChange={setTtsEngine}
        onVoiceChange={setVoiceId}
      />

      <SourceInput
        originalText={originalText}
        sourceType={sourceType}
        onTextChange={setOriginalText}
        onSourceTypeChange={setSourceType}
      />

      {error && (
        <div className="rounded-md border border-clay/50 bg-clay/5 p-3 text-clay text-sm">
          {error}
        </div>
      )}

      <StepSection
        stepNumber={1}
        title="סיפור ילדים"
        buttonLabel="צור סיפור"
        isLoading={isGeneratingStory}
        isDisabled={!originalText.trim()}
        onGenerate={generateStory}
        value={childrenStory}
        onChange={setChildrenStory}
      >
        {childrenStory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={vocalize}
            loading={isVocalizing}
          >
            {isVocalizing ? "מנקד…" : "הוסף ניקוד (אופציונלי)"}
          </Button>
        )}
      </StepSection>

      {childrenStory && !ambientPrompt && (
        <Button
          variant="ghost"
          onClick={generateSoundDesign}
          loading={isGeneratingSoundDesign}
        >
          {isGeneratingSoundDesign ? "מייצר עיצוב סאונד…" : "צור עיצוב סאונד"}
        </Button>
      )}

      {ambientPrompt && (
        <section className="space-y-2 rounded-lg border border-rule bg-paper p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium">
              אווירה
            </h3>
            <Button
              size="sm"
              onClick={generateAmbient}
              loading={isGeneratingAmbient}
              disabled={!ambientPrompt.trim()}
            >
              {isGeneratingAmbient ? "…" : "ייצר"}
            </Button>
          </div>
          <textarea
            value={ambientPrompt}
            onChange={(e) => setAmbientPrompt(e.target.value)}
            rows={3}
            className="w-full bg-paper-2 border border-rule rounded p-2.5 text-ink text-sm resize-y focus:outline-none focus:border-brass transition-colors"
            dir="ltr"
          />
          {ambientBlob && (
            <div className="space-y-1">
              <span className="text-xs text-leaf">✓ אווירה מוכנה</span>
              <audio controls src={ambientBlob} loop className="w-full h-8" />
            </div>
          )}
        </section>
      )}

      <StepSection
        stepNumber={2}
        title="הקראה"
        buttonLabel="הקרא את הסיפור"
        isLoading={isGeneratingAudio}
        isDisabled={!childrenStory.trim()}
        onGenerate={generateAudio}
        value=""
        onChange={() => {}}
      >
        {audioUrl && !isMixed && ambientBlob && (
          <Button onClick={mixAll} loading={isMixing}>
            {isMixing ? "מערבב…" : "מיקס הכל"}
          </Button>
        )}
        {isMixed && <span className="text-xs text-leaf">✓ מעורבב</span>}
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
          effort,
          ttsEngine,
          voiceId,
        }}
        audioBase64={audioBase64}
        onSaved={handleSaved}
      />

      <SavedStoriesList onLoad={handleLoadStory} />
    </div>
  );
}
