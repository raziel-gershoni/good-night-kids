"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsBar } from "./settings-bar";
import { ParashaPicker } from "./parasha-picker";
import { EditablePrompt } from "./editable-prompt";
import { SourceVersesEditor } from "./source-verses-editor";
import { SanityReportCard } from "./sanity-report-card";
import { AudioPlayer } from "./audio-player";
import { findParashaById } from "@/lib/parasha/list";
import { PARASHA_EXTRACT_IDEA_PROMPT } from "@/lib/prompts/parasha-extract-idea";
import { PARASHA_GENERATE_STORY_PROMPT } from "@/lib/prompts/parasha-generate-story";
import { PARASHA_SANITY_CHECK_PROMPT } from "@/lib/prompts/parasha-sanity-check";
import type {
  StoryModel,
  EffortLevel,
  TtsEngine,
} from "@/lib/types";
import type { SanityReport } from "@/lib/llm/schemas";

interface Verse {
  ref: string;
  text: string;
}

const STEP_HEADER_CLASS =
  "text-lg font-bold text-gold-400 flex items-center gap-2";
const STEP_NUM_CLASS =
  "inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-night-900 text-sm font-bold";

export function ParashaWizard() {
  // Settings
  const [model, setModel] = useState<StoryModel>("gemini-3.1-flash-lite-preview");
  const [effort, setEffort] = useState<EffortLevel>("high");
  const [ttsEngine, setTtsEngine] = useState<TtsEngine>("gemini");
  const [voiceId, setVoiceId] = useState("Aoede");

  // Step 1: parasha
  const [parashaId, setParashaId] = useState<string | null>(null);
  const [parashaText, setParashaText] = useState<string>("");
  const [isLoadingText, setIsLoadingText] = useState(false);

  // Step 2: idea + verses
  const [extractPrompt, setExtractPrompt] = useState<string>("");
  const [idea, setIdea] = useState<string>("");
  const [sourceVerses, setSourceVerses] = useState<Verse[]>([]);
  const [isExtractingIdea, setIsExtractingIdea] = useState(false);

  // Step 3: story
  const [storyPrompt, setStoryPrompt] = useState<string>("");
  const [childrenStory, setChildrenStory] = useState<string>("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Step 4: sanity check
  const [sanityPrompt, setSanityPrompt] = useState<string>("");
  const [sanityReport, setSanityReport] = useState<SanityReport | null>(null);
  const [isCheckingSanity, setIsCheckingSanity] = useState(false);

  // Step 5: audio
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Save
  const [isSaving, setIsSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  // Errors
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  const parasha = parashaId ? findParashaById(parashaId) : null;

  useEffect(() => {
    if (!parashaId) return;
    let cancelled = false;
    clearError();
    setIsLoadingText(true);
    setParashaText("");
    setIdea("");
    setSourceVerses([]);
    setChildrenStory("");
    setSanityReport(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setSavedSlug(null);
    (async () => {
      try {
        const res = await fetch(`/api/parasha/text?id=${encodeURIComponent(parashaId)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setParashaText(data.fullHebrewText || "");
      } catch (e) {
        if (!cancelled) setError(`טעינת הפרשה נכשלה: ${(e as Error).message}`);
      } finally {
        if (!cancelled) setIsLoadingText(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parashaId]);

  const extractIdea = useCallback(async () => {
    if (!parashaText.trim()) return;
    clearError();
    setIsExtractingIdea(true);
    setSanityReport(null);
    try {
      const res = await fetch("/api/parasha/extract-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parashaName: parasha?.hebrewName,
          parashaText,
          prompt: extractPrompt,
          model,
          effort,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setIdea(data.idea);
      setSourceVerses(data.sourceVerses);
      setChildrenStory("");
    } catch (e) {
      setError(`חילוץ הרעיון נכשל: ${(e as Error).message}`);
    } finally {
      setIsExtractingIdea(false);
    }
  }, [parashaText, parasha?.hebrewName, extractPrompt, model, effort]);

  const generateStory = useCallback(async () => {
    if (!idea.trim() || sourceVerses.length === 0) return;
    clearError();
    setIsGeneratingStory(true);
    setSanityReport(null);
    setAudioUrl(null);
    setAudioBase64(null);
    try {
      const res = await fetch("/api/parasha/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parashaName: parasha?.hebrewName,
          idea,
          sourceVerses,
          prompt: storyPrompt,
          model,
          effort,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setChildrenStory(data.childrenStory);
    } catch (e) {
      setError(`יצירת הסיפור נכשלה: ${(e as Error).message}`);
    } finally {
      setIsGeneratingStory(false);
    }
  }, [idea, sourceVerses, parasha?.hebrewName, storyPrompt, model, effort]);

  const runSanityCheck = useCallback(async () => {
    if (!childrenStory.trim()) return;
    clearError();
    setIsCheckingSanity(true);
    try {
      const res = await fetch("/api/parasha/sanity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parashaName: parasha?.hebrewName,
          idea,
          sourceVerses,
          story: childrenStory,
          prompt: sanityPrompt,
          model,
          effort,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSanityReport(data as SanityReport);
    } catch (e) {
      setError(`בדיקת איכות נכשלה: ${(e as Error).message}`);
    } finally {
      setIsCheckingSanity(false);
    }
  }, [
    childrenStory,
    parasha?.hebrewName,
    idea,
    sourceVerses,
    sanityPrompt,
    model,
    effort,
  ]);

  const generateAudio = useCallback(async () => {
    if (!childrenStory.trim()) return;
    clearError();
    setIsGeneratingAudio(true);
    try {
      const res = await fetch("/api/generate/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ttsScript: childrenStory,
          voiceId,
          ttsEngine,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setAudioBase64(data.audioBase64);
      const blob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
        { type: data.mimeType },
      );
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(`יצירת ההקראה נכשלה: ${(e as Error).message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [childrenStory, voiceId, ttsEngine]);

  const handleSave = useCallback(async () => {
    if (!childrenStory.trim() || !parasha) return;
    clearError();
    setIsSaving(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "tanakh",
          originalText: parashaText,
          childrenStory,
          model,
          effort,
          title: `${parasha.hebrewName} — ${idea.slice(0, 60)}`,
          parashaRef: parasha.englishName,
          parashaIdea: { idea, sourceVerses },
          sanityReport,
          stepPrompts: {
            extractIdea: extractPrompt,
            generateStory: storyPrompt,
            sanityCheck: sanityPrompt,
          },
          audioBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSavedSlug(data.slug);
    } catch (e) {
      setError(`שמירה נכשלה: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    childrenStory,
    parasha,
    parashaText,
    idea,
    sourceVerses,
    sanityReport,
    extractPrompt,
    storyPrompt,
    sanityPrompt,
    model,
    effort,
    audioBase64,
  ]);

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

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

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: pick parasha */}
      <div className="space-y-3">
        <h2 className={STEP_HEADER_CLASS}>
          <span className={STEP_NUM_CLASS}>1</span>
          פרשה
        </h2>
        <ParashaPicker selectedId={parashaId} onSelect={setParashaId} />
        {parashaId && (
          <div className="text-xs text-gray-400">
            {isLoadingText
              ? "טוען טקסט מספריא..."
              : parashaText
                ? `נטענו ${parashaText.length.toLocaleString()} תווים מספריא`
                : "לא נטען טקסט"}
          </div>
        )}
      </div>

      {/* Step 2: extract idea */}
      {parashaId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={STEP_HEADER_CLASS}>
              <span className={STEP_NUM_CLASS}>2</span>
              חילוץ רעיון ופסוקים
            </h2>
            <button
              onClick={extractIdea}
              disabled={!parashaText.trim() || isExtractingIdea}
              className="px-5 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-night-600 disabled:text-gray-500 text-night-900 font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              {isExtractingIdea && <Spinner />}
              {isExtractingIdea ? "מחלץ..." : idea ? "חלץ מחדש" : "חלץ רעיון"}
            </button>
          </div>
          <EditablePrompt
            storageKey="parasha.extractIdea.prompt"
            defaultPrompt={PARASHA_EXTRACT_IDEA_PROMPT}
            value={extractPrompt}
            onChange={setExtractPrompt}
          />
          {idea && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gold-400">הרעיון</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={3}
                  className="w-full bg-night-800 border border-night-600/50 rounded-xl p-3 text-white resize-y focus:outline-none focus:border-gold-400"
                />
              </div>
              <SourceVersesEditor verses={sourceVerses} onChange={setSourceVerses} />
            </div>
          )}
        </div>
      )}

      {/* Step 3: generate story */}
      {idea && sourceVerses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={STEP_HEADER_CLASS}>
              <span className={STEP_NUM_CLASS}>3</span>
              יצירת סיפור
            </h2>
            <button
              onClick={generateStory}
              disabled={isGeneratingStory}
              className="px-5 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-night-600 disabled:text-gray-500 text-night-900 font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              {isGeneratingStory && <Spinner />}
              {isGeneratingStory ? "יוצר..." : childrenStory ? "צור מחדש" : "צור סיפור"}
            </button>
          </div>
          <EditablePrompt
            storageKey="parasha.generateStory.prompt"
            defaultPrompt={PARASHA_GENERATE_STORY_PROMPT}
            value={storyPrompt}
            onChange={setStoryPrompt}
          />
          {childrenStory && (
            <>
              <textarea
                value={childrenStory}
                onChange={(e) => setChildrenStory(e.target.value)}
                rows={12}
                className="w-full bg-night-800 border border-night-600/50 rounded-xl p-4 text-white resize-y focus:outline-none focus:border-gold-400 leading-relaxed"
              />
              <div className="text-xs text-gray-500 text-left">
                {childrenStory.trim().split(/\s+/).filter(Boolean).length} מילים | {childrenStory.length} תווים
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: sanity check */}
      {childrenStory && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={STEP_HEADER_CLASS}>
              <span className={STEP_NUM_CLASS}>4</span>
              בדיקת איכות
            </h2>
            <button
              onClick={runSanityCheck}
              disabled={isCheckingSanity}
              className="px-5 py-2 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 border border-night-600/50"
            >
              {isCheckingSanity && <Spinner />}
              {isCheckingSanity ? "בודק..." : sanityReport ? "בדוק שוב" : "בדוק איכות"}
            </button>
          </div>
          <EditablePrompt
            storageKey="parasha.sanityCheck.prompt"
            defaultPrompt={PARASHA_SANITY_CHECK_PROMPT}
            value={sanityPrompt}
            onChange={setSanityPrompt}
          />
          {sanityReport && <SanityReportCard report={sanityReport} />}
        </div>
      )}

      {/* Step 5: audio */}
      {childrenStory && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={STEP_HEADER_CLASS}>
              <span className={STEP_NUM_CLASS}>5</span>
              הקראה
            </h2>
            <button
              onClick={generateAudio}
              disabled={isGeneratingAudio}
              className="px-5 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-night-600 disabled:text-gray-500 text-night-900 font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              {isGeneratingAudio && <Spinner />}
              {isGeneratingAudio ? "מקריא..." : audioUrl ? "הקרא מחדש" : "צור הקראה"}
            </button>
          </div>
          <AudioPlayer audioUrl={audioUrl} isLoading={isGeneratingAudio} />
        </div>
      )}

      {/* Save */}
      {childrenStory && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 border border-night-600/50"
          >
            {isSaving && <Spinner />}
            {isSaving ? "שומר..." : "שמור"}
          </button>
          {savedSlug && (
            <a
              href={`/share/${savedSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gold-400 hover:text-gold-300 underline"
            >
              ✓ נשמר — פתח עמוד שיתוף
            </a>
          )}
        </div>
      )}
    </div>
  );
}
