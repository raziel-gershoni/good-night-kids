import { ApiError, type Part } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import type { GeminiTtsEngine } from "../types";

const TTS_MODELS: Record<GeminiTtsEngine, string> = {
  gemini: "gemini-3.8-flash-tts",
  "gemini-expressive": "gemini-3.8-flash-tts",
  "gemini-lite": "gemini-3.8-flash-lite-tts",
  "gemini-lite-expressive": "gemini-3.8-flash-lite-tts",
};

const DEFAULT_SAMPLE_RATE = 24000;
const CHUNK_GAP_SECONDS = 0.4;

// Short and constant per Google's 3.8 guidance - long style text causes voice drift
const BASE_STYLE = "warm, calm storytelling";

// Stories are written with [tags] (prompts/shared/audio-tags.ts; Dicta nikud only
// protects [...]). Gemini 3.8 TTS reads text as a verbatim transcript, so momentary
// vocal bursts become inline English <tags>, and sustained emotions become
// speechMetadata.style (expressive engines) or are dropped.
const VOCAL_TAGS: Record<string, string> = {
  laughs: "<laugh>",
  laugh: "<laugh>",
  laughing: "<laugh>",
  giggles: "<giggle>",
  giggle: "<giggle>",
  giggling: "<giggle>",
  chuckles: "<chuckle>",
  chuckle: "<chuckle>",
  sighs: "<sigh>",
  sigh: "<sigh>",
  sighing: "<sigh>",
  gasp: "<gasp>",
  gasps: "<gasp>",
  crying: "<cry>",
  cries: "<cry>",
  sobs: "<sob>",
  sobbing: "<sob>",
  yawns: "<yawn>",
  yawn: "<yawn>",
  yawning: "<yawn>",
  coughs: "<cough>",
  cough: "<cough>",
  pause: "<short pause>",
  "short pause": "<short pause>",
  "long pause": "<long pause>",
};

const STYLE_TAGS: Record<string, string> = {
  excited: "excited",
  calm: "calm",
  curious: "curious",
  amazed: "amazed, full of wonder",
  serious: "serious",
  mischievously: "mischievous and playful",
  panicked: "panicked",
  sarcastic: "sarcastic",
  tired: "tired and sleepy",
  trembling: "trembling with fear",
  joy: "joyful",
  sadness: "sad",
  fear: "fearful",
  love: "loving and tender",
  hope: "hopeful",
  confidence: "confident",
  surprise: "surprised",
  sympathy: "sympathetic",
  anticipation: "eager anticipation",
  determination: "determined",
  enthusiasm: "enthusiastic",
  gratitude: "grateful",
  compassion: "compassionate",
  encouragement: "encouraging",
  // Whisper directives cause metallic artifacts in Gemini TTS - ask for a quiet voice instead
  whispers: "quiet and gentle",
  shouting: "loud and strong",
};

interface Segment {
  text: string;
  style: string;
}

interface Pcm {
  data: Buffer;
  sampleRate: number;
}

function createWavHeader(pcmDataLength: number, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(pcmDataLength + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmDataLength, 40);

  return header;
}

/**
 * 3.8 unary responses are complete WAV files (RIFF, 24kHz mono 16-bit);
 * headerless PCM (3.1 / streaming / AUDIO_L16) carries its rate in the mimeType.
 * Returns the bare 16-bit mono PCM frames so chunks can be concatenated.
 */
function extractPcm(bytes: Buffer, mimeType = ""): Pcm {
  let pcm: Pcm | null = null;

  if (
    bytes.length < 12 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WAVE"
  ) {
    const rate = /rate=(\d+)/i.exec(mimeType)?.[1];
    pcm = { data: bytes, sampleRate: rate ? Number(rate) : DEFAULT_SAMPLE_RATE };
  } else {
    let sampleRate: number | null = null;
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const id = bytes.toString("ascii", offset, offset + 4);
      const size = bytes.readUInt32LE(offset + 4);
      const body = offset + 8;
      if (id === "fmt ") {
        const format = bytes.readUInt16LE(body);
        const channels = bytes.readUInt16LE(body + 2);
        const bits = bytes.readUInt16LE(body + 14);
        sampleRate = bytes.readUInt32LE(body + 4);
        if ((format !== 1 && format !== 0xfffe) || channels !== 1 || bits !== 16) {
          throw new Error(
            `Unexpected Gemini TTS WAV format: ${format}/${channels}ch/${sampleRate}Hz/${bits}bit`,
          );
        }
      } else if (id === "data") {
        if (sampleRate === null) throw new Error("Gemini TTS WAV has data before fmt");
        // 0 / 0xFFFFFFFF are "unknown length" placeholders - take the rest
        const end =
          size === 0 || size === 0xffffffff
            ? bytes.length
            : Math.min(body + size, bytes.length);
        pcm = { data: bytes.subarray(body, end), sampleRate };
        break;
      }
      offset = body + size + (size & 1);
    }
    if (!pcm) throw new Error("Gemini TTS WAV has no data chunk");
  }

  // An odd byte would shift every following 16-bit sample into noise
  if (pcm.data.length % 2 !== 0) pcm.data = pcm.data.subarray(0, pcm.data.length - 1);
  return pcm;
}

function styleForTag(tag: string): string | null {
  if (STYLE_TAGS[tag]) return STYLE_TAGS[tag];
  // Unlisted one-word English tags (e.g. [nervously]) are usable as-is; anything
  // else (sound effects, Hebrew) is dropped
  return /^[a-z]{3,20}$/.test(tag) ? tag : null;
}

function tidy(text: string): string {
  return text.replace(/[ \t]{2,}/g, " ").replace(/^[ \t]+|[ \t]+$/gm, "").trim();
}

/**
 * Split one paragraph at its [tags]. Each paragraph starts from BASE_STYLE;
 * in expressive mode a style tag starts a new segment with that style.
 */
function parseParagraph(paragraph: string, expressive: boolean): Segment[] {
  const segments: Segment[] = [];
  let style = BASE_STYLE;
  let text = "";

  const flush = () => {
    const t = tidy(text);
    // Stray punctuation (e.g. an opening quote before a tag) moves to the next segment
    if (!/[\p{L}\p{N}<]/u.test(t)) return;
    segments.push({ text: t, style });
    text = "";
  };

  let last = 0;
  for (const match of paragraph.matchAll(/\[([^\]\n]+)\]/g)) {
    text += paragraph.slice(last, match.index);
    last = match.index + match[0].length;
    const tag = match[1].trim().toLowerCase();

    const vocal = VOCAL_TAGS[tag];
    if (vocal) {
      text += ` ${vocal} `;
      continue;
    }

    const nextStyle = expressive ? styleForTag(tag) : null;
    if (nextStyle && nextStyle !== style) {
      flush();
      style = nextStyle;
    } else {
      text += " ";
    }
  }
  text += paragraph.slice(last);
  flush();

  const leftover = tidy(text);
  if (leftover && segments.length > 0) {
    segments[segments.length - 1].text += leftover;
  }
  return segments;
}

/** Build the request parts for a chunk, merging neighbours that share a style. */
function buildParts(paragraphs: string[], expressive: boolean): Part[] {
  const merged: Segment[] = [];
  paragraphs.forEach((paragraph, i) => {
    parseParagraph(paragraph, expressive).forEach((segment, j) => {
      const prev = merged[merged.length - 1];
      if (prev && prev.style === segment.style) {
        prev.text += (i > 0 && j === 0 ? "\n\n" : " ") + segment.text;
      } else {
        merged.push({ ...segment });
      }
    });
  });

  return merged.map((s) => ({ text: s.text, speechMetadata: { style: s.style } }));
}

async function ttsOneChunk(model: string, parts: Part[], voiceName: string): Promise<Pcm> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { voice: voiceName },
      },
    },
  });

  const audio = (response.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => p.inlineData?.data)
    .map((p) => extractPcm(Buffer.from(p.inlineData!.data!, "base64"), p.inlineData!.mimeType));

  if (audio.length === 0) {
    throw new Error("No audio data from Gemini TTS");
  }
  if (audio.some((a) => a.sampleRate !== audio[0].sampleRate)) {
    throw new Error("Gemini TTS returned mixed sample rates");
  }

  return { data: Buffer.concat(audio.map((a) => a.data)), sampleRate: audio[0].sampleRate };
}

export async function generateSpeechGemini(params: {
  text: string;
  voiceName: string;
  engine: GeminiTtsEngine;
}): Promise<Buffer> {
  const model = TTS_MODELS[params.engine];
  let expressive = params.engine.endsWith("-expressive");

  // Split into chunks to avoid quality degradation in long audio
  // Merge short paragraphs together until each chunk is 200-600 chars
  const rawParagraphs = params.text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;
  for (const p of rawParagraphs) {
    if (currentLength > 0 && currentLength + p.length > 500) {
      chunks.push(current);
      current = [p];
      currentLength = p.length;
    } else {
      current.push(p);
      currentLength += p.length;
    }
  }
  if (current.length > 0) chunks.push(current);

  console.log(
    `Gemini TTS (${model}${expressive ? ", expressive" : ""}): ${rawParagraphs.length} paragraphs → ${chunks.length} chunks`,
  );

  // Render each chunk sequentially with retry
  const pcmChunks: Pcm[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let pcm: Pcm | null = null;
    let attempt = 0;
    while (!pcm) {
      const parts = buildParts(chunks[i], expressive);
      const chars = parts.reduce((n, p) => n + (p.text?.length ?? 0), 0);
      console.log(`  Chunk ${i + 1}/${chunks.length} (${parts.length} parts, ${chars} chars)`);
      try {
        pcm = await ttsOneChunk(model, parts, params.voiceName);
        console.log(`  Chunk ${i + 1} → ${(pcm.data.length / 2 / pcm.sampleRate).toFixed(1)}s audio`);
      } catch (err) {
        // A rejected multi-style request falls back to one style for the rest of the story
        if (expressive && err instanceof ApiError && err.status === 400) {
          console.warn(`  Chunk ${i + 1}: styled segments rejected, falling back to single style:`, err.message);
          expressive = false;
          continue;
        }
        console.error(`  Chunk ${i + 1} attempt ${attempt + 1} failed:`, err);
        if (++attempt === 3) throw err;
      }
    }
    pcmChunks.push(pcm);
  }

  const sampleRate = pcmChunks[0]?.sampleRate ?? DEFAULT_SAMPLE_RATE;
  if (pcmChunks.some((c) => c.sampleRate !== sampleRate)) {
    throw new Error("Gemini TTS chunks have mixed sample rates");
  }

  // Concatenate all PCM chunks with a short silence between them (replaces the old
  // [pause] tag, which 3.8 would read verbatim) and wrap in a single WAV header
  const gap = Buffer.alloc(Math.round(sampleRate * CHUNK_GAP_SECONDS) * 2);
  const combinedPcm = Buffer.concat(pcmChunks.flatMap((c, i) => (i > 0 ? [gap, c.data] : [c.data])));
  const wavHeader = createWavHeader(combinedPcm.length, sampleRate);
  return Buffer.concat([wavHeader, combinedPcm]);
}
