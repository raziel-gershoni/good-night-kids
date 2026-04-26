"use client";

import { useState } from "react";
import type { StoryData } from "@/lib/types";
import { Button } from "./ui";

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
      const url = isUpdate ? `/api/stories/${storyData.id}` : "/api/stories";
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...storyData, audioBase64 }),
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
    <div className="flex gap-3 flex-wrap">
      <Button
        variant="secondary"
        onClick={handleSave}
        loading={isSaving}
        disabled={!canSave}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5h11l3 3v11a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z M8 19v-6h8v6 M8 5v4h7"
          />
        </svg>
        {isSaving ? "שומר…" : "שמור"}
      </Button>

      <Button variant="ghost" onClick={handleShare} disabled={!canShare}>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.7 13.3l6.6 3.4M15.3 7.3l-6.6 3.4"
          />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="17" cy="6" r="2.5" />
          <circle cx="17" cy="18" r="2.5" />
        </svg>
        {copied ? "הקישור הועתק" : "שתף"}
      </Button>
    </div>
  );
}
