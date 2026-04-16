"use client";

import { useState, useCallback } from "react";
import { SettingsBar } from "./settings-bar";
import { SourceInput } from "./source-input";
import { StepSection } from "./step-section";
import { AudioPlayer } from "./audio-player";
import { StoryActions } from "./story-actions";
import { SavedStoriesList } from "./saved-stories-list";
import type { StoryModel, EffortLevel, TtsEngine, SourceType, SavedStory } from "@/lib/types";
import { audioBufferToWav } from "@/lib/audio-utils";

interface EffectBlob {
  label: string;
  prompt: string;
  timestampSeconds: number | null;
  audioUrl: string;
}


function parseEffectsText(text: string): { label: string; prompt: string }[] {
  const results: { label: string; prompt: string }[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (match) {
      results.push({ label: match[1].trim(), prompt: match[2].trim() });
    }
  }
  return results;
}

export function StoryWizard() {
  // Settings
  const [model, setModel] = useState<StoryModel>("gemini-3.1-flash-lite-preview");
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
  const [ttsAlignment, setTtsAlignment] = useState<unknown>(null);

  // Sound design
  const [ambientPrompt, setAmbientPrompt] = useState("");
  const [effectsText, setEffectsText] = useState("");
  const [ambientBlob, setAmbientBlob] = useState<string | null>(null); // blob URL
  const [effectBlobs, setEffectBlobs] = useState<EffectBlob[]>([]);
  const [isMixed, setIsMixed] = useState(false);

  // Loading states
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isVocalizing, setIsVocalizing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingSoundDesign, setIsGeneratingSoundDesign] = useState(false);
  const [isGeneratingAmbient, setIsGeneratingAmbient] = useState(false);
  const [isGeneratingEffects, setIsGeneratingEffects] = useState(false);
  const [isMixing, setIsMixing] = useState(false);

  // Saved story state
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  // Step 1: Generate story
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
      setEffectBlobs([]);
      setAmbientPrompt("");
      setEffectsText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת הסיפור");
    } finally {
      setIsGeneratingStory(false);
    }
  }, [originalText, sourceType, model, effort]);

  // Optional: Vocalize with Dicta Nakdan
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

  // Generate sound design from the story
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
      setEffectsText(data.effects || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת עיצוב סאונד");
    } finally {
      setIsGeneratingSoundDesign(false);
    }
  }, [childrenStory]);

  // Step 2: Narrate with ElevenLabs
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
      setTtsAlignment(data.alignment || null);
      if (data.alignment) {
        const chars = data.alignment.characters;
        const starts = data.alignment.character_start_times_seconds;
        const fullText = chars?.join("") || "";
        console.log("TTS alignment:", {
          arrayLength: chars?.length,
          stringLength: fullText.length,
          sameLength: chars?.length === fullText.length,
          firstTimestamp: starts?.[0],
          lastTimestamp: starts?.slice(-1)[0],
        });
        // Log first 20 elements raw
        console.log("First 20 alignment elements:");
        for (let i = 0; i < Math.min(20, chars?.length || 0); i++) {
          console.log(`  [${i}] char="${chars[i]}" (len=${chars[i].length}) start=${starts[i]}`);
        }
        console.log("Text preview:", fullText.slice(0, 200));
      } else {
        console.log("No alignment data from TTS");
      }
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
  }, [childrenStory, voiceId, ttsEngine]);

  // Generate ambient only
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
          { type: data.mimeType }
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

  // Generate effects only
  const generateEffects = useCallback(async () => {
    const parsed = parseEffectsText(effectsText);
    if (parsed.length === 0) return;
    clearError();
    setIsGeneratingEffects(true);
    try {
      console.log("Sending effects request:", {
        effectCount: parsed.length,
        labels: parsed.map(e => e.label),
        hasAlignment: !!ttsAlignment,
        alignmentCharCount: (ttsAlignment as { characters?: string[] })?.characters?.length,
      });
      const res = await fetch("/api/generate/sounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "effects",
          effects: parsed,
          alignment: ttsAlignment,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate effects");
      const data = await res.json();
      console.log("Effects response:", data.effects?.map((e: { label: string; timestampSeconds: number | null }) => `${e.label}: ${e.timestampSeconds !== null ? e.timestampSeconds.toFixed(2) + "s" : "NO TIMESTAMP"}`));
      const blobs: EffectBlob[] = (data.effects || []).map(
        (e: { label: string; prompt: string; timestampSeconds: number | null; audioBase64: string }) => ({
          label: e.label,
          prompt: e.prompt,
          timestampSeconds: e.timestampSeconds,
          audioUrl: URL.createObjectURL(
            new Blob(
              [Uint8Array.from(atob(e.audioBase64), (c) => c.charCodeAt(0))],
              { type: data.mimeType }
            )
          ),
        })
      );
      setEffectBlobs(blobs);
      setIsMixed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת אפקטים");
    } finally {
      setIsGeneratingEffects(false);
    }
  }, [effectsText, ttsAlignment]);

  // Mix everything
  const mixAll = useCallback(async () => {
    if (!audioBase64) return;
    clearError();
    setIsMixing(true);
    try {
      const narBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      const tempCtx = new AudioContext();
      const narBuf = await tempCtx.decodeAudioData(narBytes.buffer.slice(0));
      await tempCtx.close();

      const sampleRate = narBuf.sampleRate;
      const fadeout = 4;
      const narDuration = narBuf.length / sampleRate;
      const totalLength = narBuf.length + fadeout * sampleRate;
      const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);

      // Narration
      const narSrc = offlineCtx.createBufferSource();
      narSrc.buffer = narBuf;
      narSrc.connect(offlineCtx.destination);
      narSrc.start(0);

      // Ambient at 100% volume, looped
      if (ambientBlob) {
        const ambResp = await fetch(ambientBlob);
        const ambBuf = await offlineCtx.decodeAudioData(await ambResp.arrayBuffer());
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

      // Effects deprecated - audio tags handle effects inline in TTS

      const rendered = await offlineCtx.startRendering();
      const wavData = audioBufferToWav(rendered);
      const mixedUrl = URL.createObjectURL(new Blob([wavData], { type: "audio/wav" }));
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
    setEffectBlobs([]);

    if (story.hasAudio) {
      try {
        const res = await fetch(`/api/stories/${story.id}/audio`);
        if (res.ok) {
          const blob = await res.blob();
          setAudioUrl(URL.createObjectURL(blob));
        }
      } catch { /* */ }
    } else {
      setAudioUrl(null);
      setAudioBase64(null);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-6">
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

      {/* Generate sound design button */}
      {childrenStory && !ambientPrompt && (
        <button
          onClick={generateSoundDesign}
          disabled={isGeneratingSoundDesign}
          className="px-5 py-2 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 border border-night-600/50"
        >
          {isGeneratingSoundDesign && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isGeneratingSoundDesign ? "מייצר עיצוב סאונד..." : "צור עיצוב סאונד"}
        </button>
      )}

      {/* Sound design inputs */}
      {ambientPrompt && (
        <div className="space-y-4">
          {/* Ambient */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gold-400">אווירה</h3>
              <button
                onClick={generateAmbient}
                disabled={isGeneratingAmbient || !ambientPrompt.trim()}
                className="px-3 py-1 bg-gold-500 hover:bg-gold-400 disabled:bg-night-600 disabled:text-gray-500 text-night-900 text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                {isGeneratingAmbient && (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isGeneratingAmbient ? "..." : "ייצר"}
              </button>
            </div>
            <textarea
              value={ambientPrompt}
              onChange={(e) => setAmbientPrompt(e.target.value)}
              rows={3}
              className="w-full bg-night-800 border border-night-600/50 rounded-xl p-3 text-white text-sm resize-y focus:outline-none focus:border-gold-400"
              dir="ltr"
            />
            {ambientBlob && (
              <div className="space-y-1">
                <span className="text-xs text-green-400">✓ אווירה מוכנה</span>
                <audio controls src={ambientBlob} loop className="w-full h-8" />
              </div>
            )}
          </div>

          {/* Effects UI deprecated - audio tags handle effects inline */}
        </div>
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
        {/* Mix button */}
        {audioUrl && !isMixed && ambientBlob && (
          <button
            onClick={mixAll}
            disabled={isMixing}
            className="px-5 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-night-600 disabled:text-gray-500 text-night-900 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {isMixing && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isMixing ? "מערבב..." : "מיקס הכל"}
          </button>
        )}
        {isMixed && <span className="text-xs text-green-400">✓ מעורבב</span>}
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
