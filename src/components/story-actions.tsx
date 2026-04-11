"use client";

import { useState } from "react";
import type { StoryData } from "@/lib/types";

interface StoryActionsProps {
  storyData: StoryData;
  audioBase64: string | null;
  onSaved: (id: string, slug: string) => void;
}

export function StoryActions({
  storyData,
  audioBase64,
  onSaved,
}: StoryActionsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSave = storyData.originalText.trim().length > 0;
  const canShare = !!storyData.slug;

  async function handleSave() {
    setIsSaving(true);
    try {
      const isUpdate = !!storyData.id;
      const url = isUpdate
        ? `/api/stories/${storyData.id}`
        : "/api/stories";
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storyData,
          audioBase64,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      onSaved(data.id, data.slug);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShare() {
    if (!storyData.slug) return;
    const url = `${window.location.origin}/share/${storyData.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className="px-5 py-2 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 border border-night-600/50"
      >
        {isSaving ? (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
        )}
        {isSaving ? "שומר..." : "שמור"}
      </button>

      <button
        onClick={handleShare}
        disabled={!canShare}
        className="px-5 py-2 bg-night-700 hover:bg-night-600 disabled:bg-night-800 disabled:text-gray-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 border border-night-600/50"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {copied ? "הקישור הועתק!" : "שתף"}
      </button>
    </div>
  );
}
