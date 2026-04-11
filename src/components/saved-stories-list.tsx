"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedStory } from "@/lib/types";

interface SavedStoriesListProps {
  onLoad: (story: SavedStory) => void;
}

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
      // Silently fail for POC
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
      // Silently fail for POC
    }
  }

  const sourceLabels: Record<string, string> = {
    tanakh: 'תנ"ך',
    gmara: "גמרא",
    zohar: "זוהר",
    midrash: "מדרש",
    other: "אחר",
  };

  if (isLoading) return null;
  if (stories.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gold-400">סיפורים שמורים</h2>
      <div className="space-y-2">
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex items-center justify-between bg-night-800/50 border border-night-600/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 bg-night-700 rounded-md text-gray-400">
                {sourceLabels[story.sourceType] || story.sourceType}
              </span>
              <span className="text-white text-sm">
                {story.title || "סיפור ללא שם"}
              </span>
              {story.hasAudio && (
                <span className="text-gold-400 text-xs">🔊</span>
              )}
              <span className="text-gray-500 text-xs">
                {new Date(story.createdAt).toLocaleDateString("he-IL")}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onLoad(story)}
                className="text-sm px-3 py-1 bg-night-700 hover:bg-night-600 text-white rounded-lg transition-colors"
              >
                טען
              </button>
              <button
                onClick={() => handleDelete(story.id)}
                className="text-sm px-3 py-1 bg-night-700 hover:bg-red-900/50 text-gray-400 hover:text-red-300 rounded-lg transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
