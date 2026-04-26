"use client";

import { useRef, useState, useEffect } from "react";
import { Spinner } from "./ui";

interface AudioPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
}

export function AudioPlayer({ audioUrl, isLoading }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Reset transport when audio source changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function handleDownload() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "bedtime-story.wav";
    a.click();
  }

  if (isLoading) {
    return (
      <div className="bg-paper border border-rule rounded-lg p-4 flex items-center justify-center gap-3 text-ink-muted">
        <Spinner size={18} />
        <span className="text-sm">מייצר הקראה…</span>
      </div>
    );
  }

  if (!audioUrl) return null;

  return (
    <div className="bg-paper border border-rule rounded-lg p-4 paper-fade">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "השהה" : "נגן"}
          className="w-10 h-10 rounded-full bg-brass hover:bg-brass-soft text-canvas flex items-center justify-center transition-colors shrink-0"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 min-w-0"
          aria-label="התקדמות"
        />

        <span
          className="text-xs sm:text-sm text-ink-muted font-mono tabular-nums shrink-0"
          dir="ltr"
        >
          {formatTime(currentTime)}
          <span className="hidden sm:inline"> / {formatTime(duration)}</span>
        </span>

        <button
          onClick={handleDownload}
          aria-label="הורד"
          title="הורד"
          className="text-ink-muted hover:text-brass transition-colors p-1.5 rounded-md hover:bg-paper-2 shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
