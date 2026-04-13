"use client";

import { useState, useCallback } from "react";
import { SettingsBar } from "./settings-bar";
import { SourceInput } from "./source-input";
import { StepSection } from "./step-section";
import { AudioPlayer } from "./audio-player";
import { StoryActions } from "./story-actions";
import { SavedStoriesList } from "./saved-stories-list";
import type { StoryModel, EffortLevel, SourceType, SavedStory } from "@/lib/types";
import { audioBufferToWav } from "@/lib/audio-utils";

export function StoryWizard() {
  // Settings
  const [model, setModel] = useState<StoryModel>("gemini-3.1-flash-lite-preview");
  const [effort, setEffort] = useState<EffortLevel>("high");
  const [voiceId, setVoiceId] = useState("owHnXhz2H7U5Cv31srDU");
  const [sourceType, setSourceType] = useState<SourceType>("tanakh");

  // Content
  const [originalText, setOriginalText] = useState("");
  const [childrenStory, setChildrenStory] = useState("");
  const [ttsScript, setTtsScript] = useState(""); // vocalized story with nikud
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Sounds
  const [isGeneratingAmbient, setIsGeneratingAmbient] = useState(false);

  // Loading states
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isVocalizing, setIsVocalizing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Saved story state
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Step 1: Generate story with Claude (story + audio tags + sound design)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת הסיפור");
    } finally {
      setIsGeneratingStory(false);
    }
  }, [originalText, sourceType, model, effort]);

  // Optional: Vocalize with Dicta Nakdan (replaces story text in-place)
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
      setChildrenStory(data.ttsScript); // Replace story text in-place
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בניקוד הטקסט");
    } finally {
      setIsVocalizing(false);
    }
  }, [childrenStory]);

  // Step 2: Narrate with ElevenLabs v3
  const generateAudio = useCallback(async () => {
    clearError();
    setIsGeneratingAudio(true);
    try {
      const res = await fetch("/api/generate/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsScript: childrenStory, voiceId }),
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
  }, [childrenStory, voiceId]);

  // Step 4: Generate sounds and pre-mix everything into one track
  const generateSounds = useCallback(async () => {
    if (!audioBase64) return;
    clearError();
    setIsGeneratingAmbient(true);
    try {
      const formData = new FormData();
      formData.append("storyText", childrenStory);
      const narrationBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      formData.append("narration", new Blob([narrationBytes], { type: "audio/mpeg" }), "narration.mp3");

      const res = await fetch("/api/generate/sounds", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate sounds (${res.status})`);
      }
      const data = await res.json();
      console.log("Sounds response:", {
        hasAmbient: !!data.ambientBase64,
        ambientError: data.ambientError,
        effectCount: data.effects?.length ?? 0,
      });

      // Pre-mix narration + ambient + effects into single track
      console.log("Mixing tracks...");
      // First decode narration to get its sample rate
      const tempCtx = new AudioContext();
      const narrationBuf = await tempCtx.decodeAudioData(narrationBytes.buffer.slice(0));
      await tempCtx.close();

      const sampleRate = narrationBuf.sampleRate;
      const fadeout = 4;
      const narDuration = narrationBuf.length / sampleRate;
      const totalLength = narrationBuf.length + fadeout * sampleRate;
      const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);
      console.log("Narration:", narDuration.toFixed(1), "s, sampleRate:", sampleRate);

      // Narration
      const narSrc = offlineCtx.createBufferSource();
      narSrc.buffer = narrationBuf;
      narSrc.connect(offlineCtx.destination);
      narSrc.start(0);

      // Ambient loop with fadeout
      if (data.ambientBase64) {
        const ambBytes = Uint8Array.from(atob(data.ambientBase64), (c) => c.charCodeAt(0));
        const ambBuf = await offlineCtx.decodeAudioData(ambBytes.buffer.slice(0));
        console.log("Ambient decoded:", ambBuf.duration.toFixed(1), "s, sampleRate:", ambBuf.sampleRate);
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
        console.log("Ambient mixed:", loops, "loops");
      } else {
        console.log("No ambient to mix");
      }

      // Effects at timestamps
      if (data.effects?.length) {
        for (let i = 0; i < data.effects.length; i++) {
          const e = data.effects[i];
          try {
            const effBytes = Uint8Array.from(atob(e.audioBase64), (c) => c.charCodeAt(0));
            const effBuf = await offlineCtx.decodeAudioData(effBytes.buffer.slice(0));
            const effSrc = offlineCtx.createBufferSource();
            effSrc.buffer = effBuf;
            const effGain = offlineCtx.createGain();
            effGain.gain.value = 0.7;
            effSrc.connect(effGain).connect(offlineCtx.destination);
            const time = e.timestampSeconds ?? ((i + 1) / (data.effects.length + 1)) * narDuration;
            console.log(`Effect "${e.label}" at ${time.toFixed(1)}s`);
            effSrc.start(Math.min(time, narDuration));
          } catch { /* skip failed effect */ }
        }
      }

      const rendered = await offlineCtx.startRendering();

      // Convert to WAV blob
      const wavData = audioBufferToWav(rendered);
      const mixedBlob = new Blob([wavData], { type: "audio/wav" });
      const mixedUrl = URL.createObjectURL(mixedBlob);
      console.log("Mix complete:", (rendered.length / sampleRate).toFixed(1), "seconds");

      // Replace the narration with the mixed track
      setAudioUrl(mixedUrl);
      setAudioBase64(null); // Can't re-mix, but download works
    } catch (err) {
      console.error("Mix error:", err);
      setError(err instanceof Error ? err.message : "שגיאה ביצירת צלילים");
    } finally {
      setIsGeneratingAmbient(false);
    }
  }, [childrenStory, audioBase64]);

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

    if (story.hasAudio) {
      try {
        const res = await fetch(`/api/stories/${story.id}/audio`);
        if (res.ok) {
          const blob = await res.blob();
          setAudioUrl(URL.createObjectURL(blob));
        }
      } catch {
        // Audio load failed
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
        effort={effort}
        voiceId={voiceId}
        onModelChange={setModel}
        onEffortChange={setEffort}
        onVoiceChange={setVoiceId}
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
        buttonLabel="צור סיפור"
        isLoading={isGeneratingStory}
        isDisabled={!originalText.trim()}
        onGenerate={generateStory}
        value={childrenStory}
        onChange={setChildrenStory}
      >
        {childrenStory && (
          <button
            onClick={vocalize}
            disabled={isVocalizing}
            className="px-4 py-1.5 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-sm text-gray-300 rounded-lg transition-colors flex items-center gap-2 border border-night-600/50"
          >
            {isVocalizing && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isVocalizing ? "מנקד..." : "הוסף ניקוד (אופציונלי)"}
          </button>
        )}
      </StepSection>

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
        {audioUrl && audioBase64 && (
          <button
            onClick={generateSounds}
            disabled={isGeneratingAmbient}
            className="px-4 py-1.5 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-sm text-gray-300 rounded-lg transition-colors flex items-center gap-2 border border-night-600/50"
          >
            {isGeneratingAmbient && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isGeneratingAmbient ? "מייצר אווירה..." : "ייצר אווירה"}
          </button>
        )}
        <AudioPlayer
          audioUrl={audioUrl}
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
          effort,
          voiceId,
        }}
        audioBase64={audioBase64}
        onSaved={handleSaved}
      />

      <SavedStoriesList onLoad={handleLoadStory} />
    </div>
  );
}
