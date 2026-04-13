"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export interface SoundEffectData {
  label: string;
  audioUrl: string;
  timestampSeconds: number | null;
  fallbackPosition: number;
}

interface AudioPlayerProps {
  audioUrl: string | null;
  ambientUrl: string | null;
  effects: SoundEffectData[];
  isLoading: boolean;
}

export function AudioPlayer({
  audioUrl,
  ambientUrl,
  effects,
  isLoading,
}: AudioPlayerProps) {
  const narrationRef = useRef<HTMLAudioElement>(null);
  const ambientRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [isMixing, setIsMixing] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  useEffect(() => {
    if (ambientRef.current) ambientRef.current.volume = ambientVolume;
  }, [ambientVolume]);

  // Auto-start ambient if narration is already playing
  // Use a small delay so the <audio> tag has time to mount after ambientUrl changes
  useEffect(() => {
    if (!ambientUrl || !isPlaying) return;
    const timer = setTimeout(() => {
      if (ambientRef.current) {
        ambientRef.current.volume = ambientVolume;
        ambientRef.current.play().catch(() => {});
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [ambientUrl, isPlaying, ambientVolume]);

  const effectTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function scheduleEffects() {
    effectTimeoutsRef.current.forEach(clearTimeout);
    effectTimeoutsRef.current = [];
    if (!narrationRef.current || !effects.length) return;
    const dur = narrationRef.current.duration || duration;
    if (!dur) return;
    const pos = narrationRef.current.currentTime;
    console.log(`Scheduling ${effects.length} effects, duration=${dur}, pos=${pos}`);
    effects.forEach((effect, i) => {
      // Use timestamp if available, otherwise spread evenly
      const time = effect.timestampSeconds ?? (effect.fallbackPosition > 0 ? effect.fallbackPosition * dur : ((i + 1) / (effects.length + 1)) * dur);
      const delay = (time - pos) * 1000;
      console.log(`Effect "${effect.label}" at ${time.toFixed(1)}s, delay=${(delay/1000).toFixed(1)}s`);
      if (delay > 0) {
        effectTimeoutsRef.current.push(
          setTimeout(() => {
            console.log(`Playing effect: ${effect.label}`);
            const a = new Audio(effect.audioUrl);
            a.volume = 0.7;
            a.play();
          }, delay)
        );
      }
    });
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function togglePlay() {
    if (!narrationRef.current) return;

    if (isPlaying) {
      narrationRef.current.pause();
      ambientRef.current?.pause();
      effectTimeoutsRef.current.forEach(clearTimeout);
    } else {
      narrationRef.current.play();
      if (ambientRef.current) {
        ambientRef.current.volume = ambientVolume;
        ambientRef.current.play().catch(() => {});
      }
      scheduleEffects();
    }
    setIsPlaying(!isPlaying);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!narrationRef.current) return;
    const time = parseFloat(e.target.value);
    narrationRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function handleNarrationEnded() {
    setIsPlaying(false);
    ambientRef.current?.pause();
    effectTimeoutsRef.current.forEach(clearTimeout);
  }

  const handleDownload = useCallback(async () => {
    if (!audioUrl) return;

    if (!ambientUrl) {
      // No ambient - download narration directly
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "bedtime-story.mp3";
      a.click();
      return;
    }

    // Mix narration + ambient into single WAV
    setIsMixing(true);
    try {
      const [narrationResp, ambientResp] = await Promise.all([
        fetch(audioUrl).then((r) => r.arrayBuffer()),
        fetch(ambientUrl).then((r) => r.arrayBuffer()),
      ]);

      const tempCtx = new AudioContext();
      const [narrationBuf, ambientBuf] = await Promise.all([
        tempCtx.decodeAudioData(narrationResp),
        tempCtx.decodeAudioData(ambientResp),
      ]);
      await tempCtx.close();

      const sampleRate = narrationBuf.sampleRate;
      const fadeout = 4;
      const totalLength = narrationBuf.length + fadeout * sampleRate;
      const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);

      // Narration
      const narSrc = offlineCtx.createBufferSource();
      narSrc.buffer = narrationBuf;
      narSrc.connect(offlineCtx.destination);
      narSrc.start(0);

      // Ambient loop with fadeout
      const ambGain = offlineCtx.createGain();
      const narDuration = narrationBuf.length / sampleRate;
      ambGain.gain.setValueAtTime(ambientVolume, 0);
      ambGain.gain.setValueAtTime(ambientVolume, narDuration);
      ambGain.gain.linearRampToValueAtTime(0, narDuration + fadeout);

      const loops = Math.ceil(totalLength / ambientBuf.length);
      for (let i = 0; i < loops; i++) {
        const src = offlineCtx.createBufferSource();
        src.buffer = ambientBuf;
        src.connect(ambGain).connect(offlineCtx.destination);
        src.start((i * ambientBuf.length) / sampleRate);
      }

      const rendered = await offlineCtx.startRendering();
      const wavData = audioBufferToWav(rendered);
      const blob = new Blob([wavData], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bedtime-story-mixed.wav";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Mix error:", err);
      // Fallback: download narration only
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "bedtime-story.mp3";
      a.click();
    } finally {
      setIsMixing(false);
    }
  }, [audioUrl, ambientUrl, ambientVolume]);

  if (isLoading) {
    return (
      <div className="bg-night-800 border border-night-600/50 rounded-xl p-4 flex items-center justify-center gap-3">
        <svg
          className="animate-spin h-5 w-5 text-gold-400"
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
        <span className="text-gray-300">מייצר הקראה...</span>
      </div>
    );
  }

  if (!audioUrl) return null;

  return (
    <div className="bg-night-800 border border-night-600/50 rounded-xl p-4 space-y-3">
      <audio
        ref={narrationRef}
        src={audioUrl}
        onTimeUpdate={() =>
          setCurrentTime(narrationRef.current?.currentTime ?? 0)
        }
        onLoadedMetadata={() =>
          setDuration(narrationRef.current?.duration ?? 0)
        }
        onEnded={handleNarrationEnded}
      />
      {ambientUrl && (
        <audio ref={ambientRef} src={ambientUrl} loop />
      )}

      {/* Main controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-gold-500 hover:bg-gold-400 text-night-900 flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-gold-400 h-1"
        />

        <span
          className="text-sm text-gray-400 font-mono min-w-[80px] text-center"
          dir="ltr"
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          onClick={handleDownload}
          disabled={isMixing}
          className="text-gray-400 hover:text-gold-400 transition-colors"
          title="הורד"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>
      </div>

      {/* Volume control for ambient */}
      {ambientUrl && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>אווירה:</span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={ambientVolume}
            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
            className="w-24 accent-gold-400 h-1"
          />
          <span className="text-gray-500 min-w-[32px]">{Math.round(ambientVolume * 200)}%</span>
        </div>
      )}

      {/* Sound effects - click to preview */}
      {effects.length > 0 && (
        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
          <span>אפקטים:</span>
          {effects.map((effect, i) => (
            <button
              key={i}
              onClick={() => {
                const a = new Audio(effect.audioUrl);
                a.volume = 0.5;
                a.play();
              }}
              className="px-2 py-0.5 bg-night-700/50 hover:bg-night-600 rounded text-gray-400 hover:text-gold-400 transition-colors cursor-pointer"
              title="לחץ להשמעה"
            >
              ▶ {effect.label} {effect.timestampSeconds !== null ? `(${formatTime(effect.timestampSeconds)})` : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * (bitsPerSample / 8);
  const totalSize = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function w(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  w(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  w(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return arrayBuffer;
}
