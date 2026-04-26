"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedStory } from "@/lib/types";

interface SavedStoriesListProps {
  onLoad: (story: SavedStory) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  tanakh: 'תנ"ך',
  gmara: "גמרא",
  zohar: "זוהר",
  midrash: "מדרש",
  other: "אחר",
};

export function SavedStoriesList({ onLoad }: SavedStoriesListProps) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories);
      }
    } catch {
      /* silent for POC */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/stories/${id}`, { method: "DELETE" });
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* silent */
    }
  }

  if (isLoading || stories.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-medium text-ink">סיפורים שמורים</h2>
      <div className="rounded-lg border border-rule overflow-hidden bg-paper">
        {stories.map((story, idx) => (
          <article
            key={story.id}
            className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 ${
              idx > 0 ? "border-t border-rule" : ""
            } hover:bg-paper-2 transition-colors`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle px-2 py-0.5 border border-rule rounded shrink-0">
                {SOURCE_LABELS[story.sourceType] || story.sourceType}
              </span>
              <span
                className="font-display text-base text-ink truncate"
                title={story.title || undefined}
              >
                {story.title || "סיפור ללא שם"}
              </span>
              {story.hasAudio && (
                <SpeakerIcon className="w-3.5 h-3.5 text-brass shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-between sm:justify-end">
              <span
                className="text-xs text-ink-subtle tabular-nums"
                dir="ltr"
              >
                {new Date(story.createdAt).toLocaleDateString("he-IL")}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onLoad(story)}
                  className="text-xs px-2.5 py-1 text-ink-muted hover:text-brass hover:bg-paper-2 rounded transition-colors"
                >
                  טען
                </button>
                <button
                  onClick={() => handleDelete(story.id)}
                  className="text-xs px-2.5 py-1 text-ink-subtle hover:text-clay hover:bg-paper-2 rounded transition-colors"
                >
                  מחק
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SpeakerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5L6 9H3v6h3l5 4V5zM15 9a3 3 0 010 6M18 6a7 7 0 010 12"
      />
    </svg>
  );
}
