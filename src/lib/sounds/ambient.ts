import { getGeminiClient } from "../gemini/client";

const ELEVENLABS_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation";

// --- Ambient generation ---

export async function generateAmbientSound(
  prompt: string
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  console.log("Calling ElevenLabs SFX API for ambient...");
  const response = await fetch(ELEVENLABS_SFX_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: 22,
      loop: true,
      model_id: "eleven_text_to_sound_v2",
    }),
  });

  console.log("ElevenLabs ambient response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ElevenLabs ambient error: ${response.status} - ${errorText}`);
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log("Ambient audio received:", arrayBuffer.byteLength, "bytes");
  return Buffer.from(arrayBuffer);
}

// --- Sound effect generation ---

async function generateSfx(prompt: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  const response = await fetch(ELEVENLABS_SFX_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: 4,
      prompt_influence: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs SFX error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// --- Gemini audio analysis for timestamps ---

async function findEffectTimestamps(
  narrationBase64: string,
  effectLabels: string[]
): Promise<Map<string, number>> {
  const ai = getGeminiClient();

  const labelList = effectLabels
    .map((label, i) => `${i + 1}. "${label}"`)
    .join("\n");

  console.log("Asking Gemini for effect timestamps...");

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/mpeg",
              data: narrationBase64,
            },
          },
          {
            text: `Listen to this Hebrew audio narration. For each phrase below, tell me the approximate timestamp (in seconds) when it is spoken.

${labelList}

Respond ONLY in this exact format, one per line:
1. [seconds]
2. [seconds]

Example:
1. 12.5
2. 34.0

Give only the numbers, no other text.`,
          },
        ],
      },
    ],
  });

  const text = response.text ?? "";

  console.log("Claude timestamp response:", text);

  const timestamps = new Map<string, number>();
  const lines = text.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/(\d+)\.\s*([\d.]+)/);
    if (match) {
      const index = parseInt(match[1], 10) - 1;
      const seconds = parseFloat(match[2]);
      if (index >= 0 && index < effectLabels.length && !isNaN(seconds)) {
        timestamps.set(effectLabels[index], seconds);
      }
    }
  }

  return timestamps;
}

// --- Parsing ---

export interface SoundEffect {
  label: string;
  prompt: string;
}

export interface SoundDesign {
  ambientPrompt: string;
  effects: SoundEffect[];
}

export function parseSoundDesign(storyText: string): SoundDesign | null {
  const marker = "### עיצוב סאונד";
  const idx = storyText.indexOf(marker);
  if (idx === -1) return null;

  const section = storyText.slice(idx + marker.length);

  const ambientMatch = section.match(/אווירה:\s*(.+)/);

  const effectsRegex = /(?:\*|-|•)\s*(?:\[)?([^\]\-–—\n]+?)(?:\])?\s*[-–—]\s*(.+)/g;
  const effects: SoundEffect[] = [];
  let match;
  while ((match = effectsRegex.exec(section)) !== null) {
    const label = match[1].trim();
    const prompt = match[2].trim();
    if (label.startsWith("Effect") || label.startsWith("הערה") || label.length < 2) continue;
    effects.push({ label, prompt });
  }

  console.log("Parsed effects:", effects.length, effects.map((e) => `${e.label}: ${e.prompt.slice(0, 40)}`));

  return {
    ambientPrompt:
      ambientMatch?.[1]?.trim() ||
      "Gentle bedtime lullaby with soft piano, peaceful nighttime atmosphere, instrumental only, no vocals, seamless loop",
    effects,
  };
}

// --- Main: generate all sounds ---

export async function generateAllSounds(params: {
  storyText: string;
  narrationBase64?: string;
}): Promise<{
  ambientBase64: string | null;
  ambientError: string | null;
  effects: { label: string; timestampSeconds: number | null; audioBase64: string }[];
}> {
  const soundDesign = parseSoundDesign(params.storyText);
  const ambientPrompt = soundDesign?.ambientPrompt ||
    "Gentle bedtime lullaby with soft piano, peaceful nighttime atmosphere, instrumental only, no vocals, seamless loop";
  const effectsToGen = soundDesign?.effects.slice(0, 8) || [];

  console.log("Generating sounds:", {
    ambient: ambientPrompt.slice(0, 80),
    effects: effectsToGen.length,
    hasNarration: !!params.narrationBase64,
  });

  // 1. Timestamp analysis (if narration provided)
  let timestamps = new Map<string, number>();
  if (params.narrationBase64 && effectsToGen.length > 0) {
    try {
      timestamps = await findEffectTimestamps(
        params.narrationBase64,
        effectsToGen.map((e) => e.label)
      );
      console.log("Timestamps found:", Object.fromEntries(timestamps));
    } catch (err) {
      console.error("Timestamp analysis failed:", err);
    }
  }

  // 2. Generate ambient
  let ambientError: string | null = null;
  let ambientBuffer: Buffer | null = null;
  try {
    ambientBuffer = await generateAmbientSound(ambientPrompt);
    if (!ambientBuffer) ambientError = "Ambient returned null (unknown error)";
  } catch (err) {
    ambientError = err instanceof Error ? err.message : String(err);
    console.error("Ambient generation failed:", ambientError);
  }

  // 3. Generate effects sequentially (rate limit)
  const effectResults: { label: string; timestampSeconds: number | null; audioBase64: string }[] = [];
  for (const e of effectsToGen) {
    try {
      const buf = await generateSfx(e.prompt);
      effectResults.push({
        label: e.label,
        timestampSeconds: timestamps.get(e.label) ?? null,
        audioBase64: buf.toString("base64"),
      });
    } catch (err) {
      console.error(`Effect "${e.label}" failed:`, err);
    }
  }

  return {
    ambientBase64: ambientBuffer?.toString("base64") ?? null,
    ambientError,
    effects: effectResults,
  };
}
