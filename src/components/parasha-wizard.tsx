"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsBar } from "./settings-bar";
import { ParashaPicker } from "./parasha-picker";
import { EditablePrompt } from "./editable-prompt";
import { SourceVersesEditor } from "./source-verses-editor";
import { SanityReportCard } from "./sanity-report-card";
import { AudioPlayer } from "./audio-player";
import { Button, Section } from "./ui";
import { findParashaById } from "@/lib/parasha/list";
import { PARASHA_EXTRACT_IDEA_PROMPT } from "@/lib/prompts/parasha-extract-idea";
import { PARASHA_GENERATE_STORY_PROMPT } from "@/lib/prompts/parasha-generate-story";
import { PARASHA_SANITY_CHECK_PROMPT } from "@/lib/prompts/parasha-sanity-check";
import type { StoryModel, EffortLevel, TtsEngine } from "@/lib/types";
import type { SanityReport } from "@/lib/llm/schemas";

interface Verse {
  ref: string;
  text: string;
}

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

  // Step 4: sanity
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
        const res = await fetch(
          `/api/parasha/text?id=${encodeURIComponent(parashaId)}`,
        );
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

  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8 sm:space-y-10">
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
        <div className="rounded-md border border-clay/50 bg-clay/5 p-3 text-clay text-sm">
          {error}
        </div>
      )}

      {/* Step 1 */}
      <Section step={1} title="פרשה" description="בחרו פרשה — ברירת המחדל היא פרשת השבוע">
        <ParashaPicker selectedId={parashaId} onSelect={setParashaId} />
        {parashaId && (
          <div className="mt-2 text-xs text-ink-subtle tabular-nums" dir="ltr">
            {isLoadingText
              ? "טוען טקסט מספריא…"
              : parashaText
                ? `${parashaText.length.toLocaleString()} תווים מספריא`
                : "לא נטען טקסט"}
          </div>
        )}
      </Section>

      {/* Step 2 */}
      {parashaId && (
        <Section
          step={2}
          title="חילוץ רעיון ופסוקים"
          description="ה-LLM מציע רעיון אחד ופסוקים מקוריים — ניתן לערוך גם את הפרומפט וגם את הפלט"
          action={
            <Button
              onClick={extractIdea}
              loading={isExtractingIdea}
              disabled={!parashaText.trim() || isExtractingIdea}
            >
              {isExtractingIdea ? "מחלץ…" : idea ? "חלץ מחדש" : "חלץ רעיון"}
            </Button>
          }
        >
          <div className="space-y-4">
            <EditablePrompt
              storageKey="parasha.extractIdea.prompt"
              defaultPrompt={PARASHA_EXTRACT_IDEA_PROMPT}
              value={extractPrompt}
              onChange={setExtractPrompt}
            />
            {idea && (
              <div className="space-y-4 paper-fade">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium">
                    הרעיון
                  </label>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={3}
                    className="w-full bg-paper border border-rule rounded-md p-3 text-ink leading-relaxed resize-y focus:outline-none focus:border-brass transition-colors"
                  />
                </div>
                <SourceVersesEditor
                  verses={sourceVerses}
                  onChange={setSourceVerses}
                />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 3 */}
      {idea && sourceVerses.length > 0 && (
        <Section
          step={3}
          title="יצירת סיפור"
          description="סיפור מקורי שמסביר את הרעיון, עם גשר אחד מפורש לפסוקי הפרשה"
          action={
            <Button
              onClick={generateStory}
              loading={isGeneratingStory}
              disabled={isGeneratingStory}
            >
              {isGeneratingStory ? "יוצר…" : childrenStory ? "צור מחדש" : "צור סיפור"}
            </Button>
          }
        >
          <div className="space-y-4">
            <EditablePrompt
              storageKey="parasha.generateStory.prompt"
              defaultPrompt={PARASHA_GENERATE_STORY_PROMPT}
              value={storyPrompt}
              onChange={setStoryPrompt}
            />
            {childrenStory && (
              <div className="space-y-1.5 paper-fade">
                <textarea
                  value={childrenStory}
                  onChange={(e) => setChildrenStory(e.target.value)}
                  rows={14}
                  className="w-full bg-paper border border-rule rounded-md p-4 sm:p-5 text-ink leading-loose font-display text-base resize-y focus:outline-none focus:border-brass transition-colors"
                />
                <div
                  className="text-xs text-ink-subtle text-left tabular-nums"
                  dir="ltr"
                >
                  {wordCount(childrenStory)} מילים · {childrenStory.length} תווים
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 4 */}
      {childrenStory && (
        <Section
          step={4}
          title="בדיקת איכות"
          description="בודק את הסיפור מול הרעיון, הפסוקים והגיל — אופציונלי"
          action={
            <Button
              variant="secondary"
              onClick={runSanityCheck}
              loading={isCheckingSanity}
              disabled={isCheckingSanity}
            >
              {isCheckingSanity ? "בודק…" : sanityReport ? "בדוק שוב" : "בדוק איכות"}
            </Button>
          }
        >
          <div className="space-y-4">
            <EditablePrompt
              storageKey="parasha.sanityCheck.prompt"
              defaultPrompt={PARASHA_SANITY_CHECK_PROMPT}
              value={sanityPrompt}
              onChange={setSanityPrompt}
            />
            {sanityReport && <SanityReportCard report={sanityReport} />}
          </div>
        </Section>
      )}

      {/* Step 5 */}
      {childrenStory && (
        <Section
          step={5}
          title="הקראה"
          description="הסיפור הופך לאודיו דרך מנוע ה-TTS שנבחר"
          action={
            <Button
              onClick={generateAudio}
              loading={isGeneratingAudio}
              disabled={isGeneratingAudio}
            >
              {isGeneratingAudio
                ? "מקריא…"
                : audioUrl
                  ? "הקרא מחדש"
                  : "צור הקראה"}
            </Button>
          }
        >
          <AudioPlayer audioUrl={audioUrl} isLoading={isGeneratingAudio} />
        </Section>
      )}

      {/* Save */}
      {childrenStory && (
        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
          >
            {isSaving ? "שומר…" : "שמור"}
          </Button>
          {savedSlug && (
            <a
              href={`/share/${savedSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brass hover:text-brass-soft underline-offset-4 hover:underline transition-colors"
            >
              נשמר — פתח עמוד שיתוף ←
            </a>
          )}
        </div>
      )}
    </div>
  );
}
