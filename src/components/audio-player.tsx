"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export interface SoundEffectData {
  label: string;
  audioUrl: string;
  position: number; // 0-1 ratio in the story
}

interface AudioPlayerProps {
  audioUrl: string | null;
  musicUrl: string | null;
  ambientUrl: string | null;
  effects: SoundEffectData[];
  isLoading: boolean;
}

export function AudioPlayer({
  audioUrl,
  musicUrl,
  ambientUrl,
  effects,
  isLoading,
}: AudioPlayerProps) {
  const narrationRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const ambientRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [ambientVolume, setAmbientVolume] = useState(0.1);
  const [isMixing, setIsMixing] = useState(false);
  const effectTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playedEffectsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (ambientRef.current) ambientRef.current.volume = ambientVolume;
  }, [ambientVolume]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function scheduleEffects() {
    // Clear any existing scheduled effects
    effectTimeoutsRef.current.forEach(clearTimeout);
    effectTimeoutsRef.current = [];
    playedEffectsRef.current.clear();

    if (!narrationRef.current || !effects.length || !duration) return;

    const currentPos = narrationRef.current.currentTime;

    effects.forEach((effect, i) => {
      const effectTime = effect.position * duration;
      const delay = (effectTime - currentPos) * 1000;

      if (delay > 0) {
        const timeout = setTimeout(() => {
          if (!playedEffectsRef.current.has(i)) {
            playedEffectsRef.current.add(i);
            const audio = new Audio(effect.audioUrl);
            audio.volume = 0.3;
            audio.play();
          }
        }, delay);
        effectTimeoutsRef.current.push(timeout);
      }
    });
  }

  function clearScheduledEffects() {
    effectTimeoutsRef.current.forEach(clearTimeout);
    effectTimeoutsRef.current = [];
  }

  function togglePlay() {
    if (!narrationRef.current) return;
    if (isPlaying) {
      narrationRef.current.pause();
      musicRef.current?.pause();
      ambientRef.current?.pause();
      clearScheduledEffects();
    } else {
      narrationRef.current.play();
      if (musicRef.current) {
        musicRef.current.currentTime = 0;
        musicRef.current.play();
      }
      if (ambientRef.current) {
        ambientRef.current.currentTime = 0;
        ambientRef.current.play();
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
    if (isPlaying) scheduleEffects();
  }

  function handleNarrationEnded() {
    setIsPlaying(false);
    musicRef.current?.pause();
    ambientRef.current?.pause();
  }

  const handleDownload = useCallback(async () => {
    if (!audioUrl) return;
    setIsMixing(true);

    try {
      const audioContext = new OfflineAudioContext(1, 1, 24000);

      // Load narration
      const narrationResponse = await fetch(audioUrl);
      const narrationArrayBuffer = await narrationResponse.arrayBuffer();
      const narrationBuffer =
        await audioContext.decodeAudioData(narrationArrayBuffer);

      const totalLength = narrationBuffer.length;
      const sampleRate = narrationBuffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);

      // Narration at full volume
      const narrationSource = offlineCtx.createBufferSource();
      narrationSource.buffer = narrationBuffer;
      const narrationGain = offlineCtx.createGain();
      narrationGain.gain.value = 1.0;
      narrationSource.connect(narrationGain).connect(offlineCtx.destination);
      narrationSource.start(0);

      // Spot effects at their positions
      for (const effect of effects) {
        try {
          const effectResponse = await fetch(effect.audioUrl);
          const effectArrayBuffer = await effectResponse.arrayBuffer();
          const effectBuffer = await offlineCtx.decodeAudioData(effectArrayBuffer);
          const effectSource = offlineCtx.createBufferSource();
          effectSource.buffer = effectBuffer;
          const effectGain = offlineCtx.createGain();
          effectGain.gain.value = 0.3;
          effectSource.connect(effectGain).connect(offlineCtx.destination);
          effectSource.start(effect.position * (totalLength / sampleRate));
        } catch {
          // Skip effect if it fails to decode
        }
      }

      // Music loop at low volume
      if (musicUrl) {
        const musicResponse = await fetch(musicUrl);
        const musicArrayBuffer = await musicResponse.arrayBuffer();
        const musicBuffer = await offlineCtx.decodeAudioData(musicArrayBuffer);
        const musicGain = offlineCtx.createGain();
        musicGain.gain.value = musicVolume;

        const loopCount = Math.ceil(totalLength / musicBuffer.length);
        for (let i = 0; i < loopCount; i++) {
          const source = offlineCtx.createBufferSource();
          source.buffer = musicBuffer;
          source.connect(musicGain).connect(offlineCtx.destination);
          source.start((i * musicBuffer.length) / sampleRate);
        }
      }

      // Ambient loop at low volume
      if (ambientUrl) {
        const ambientResponse = await fetch(ambientUrl);
        const ambientArrayBuffer = await ambientResponse.arrayBuffer();
        const ambientBuffer =
          await offlineCtx.decodeAudioData(ambientArrayBuffer);
        const ambientGain = offlineCtx.createGain();
        ambientGain.gain.value = ambientVolume;

        const loopCount = Math.ceil(totalLength / ambientBuffer.length);
        for (let i = 0; i < loopCount; i++) {
          const source = offlineCtx.createBufferSource();
          source.buffer = ambientBuffer;
          source.connect(ambientGain).connect(offlineCtx.destination);
          source.start((i * ambientBuffer.length) / sampleRate);
        }
      }

      const rendered = await offlineCtx.startRendering();

      // Convert to WAV
      const wavData = audioBufferToWav(rendered);
      const blob = new Blob([wavData], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bedtime-story-mixed.wav";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Mix download error:", err);
      // Fallback: download narration only
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "bedtime-story.wav";
      a.click();
    } finally {
      setIsMixing(false);
    }
  }, [audioUrl, musicUrl, ambientUrl, musicVolume, ambientVolume]);

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
      {musicUrl && (
        <audio ref={musicRef} src={musicUrl} loop />
      )}
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
          title={isMixing ? "מערבב..." : "הורד (מעורבב)"}
        >
          {isMixing ? (
            <svg
              className="animate-spin w-5 h-5"
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
          )}
        </button>
      </div>

      {/* Volume controls for music/ambient */}
      {(musicUrl || ambientUrl) && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          {musicUrl && (
            <div className="flex items-center gap-2">
              <span>מוזיקה:</span>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-20 accent-gold-400 h-1"
              />
            </div>
          )}
          {ambientUrl && (
            <div className="flex items-center gap-2">
              <span>אווירה:</span>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-20 accent-gold-400 h-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Sound effects info */}
      {effects.length > 0 && (
        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
          <span>אפקטים:</span>
          {effects.map((effect, i) => (
            <span key={i} className="px-2 py-0.5 bg-night-700/50 rounded text-gray-400">
              {effect.label} ({formatTime(effect.position * (duration || 0))})
            </span>
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
  const headerSize = 44;
  const totalSize = headerSize + dataLength;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(
      offset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
    offset += 2;
  }

  return arrayBuffer;
}
