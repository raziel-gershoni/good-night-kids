import { getGeminiClient } from "./client";

// Lyria 3 for ambient/music loops
async function generateLyriaClip(prompt: string): Promise<Buffer> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "lyria-3-clip-preview",
    contents: prompt,
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error("No audio data from Lyria 3");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No audio data in Lyria 3 response");
}

// ElevenLabs for actual sound effects
async function generateElevenLabsSfx(
  prompt: string,
  durationSeconds: number = 3
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: durationSeconds,
        prompt_influence: 0.5,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs SFX error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateAmbientSound(prompt: string): Promise<Buffer> {
  return generateLyriaClip(prompt);
}

export async function generateSoundEffect(prompt: string): Promise<Buffer> {
  return generateElevenLabsSfx(prompt, 4);
}

// Use Gemini audio analysis to find exact timestamps for effect phrases
export async function findEffectTimestamps(
  narrationBase64: string,
  effectLabels: string[]
): Promise<Map<string, number>> {
  const ai = getGeminiClient();

  const labelList = effectLabels
    .map((label, i) => `${i + 1}. "${label}"`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: narrationBase64,
            },
          },
          {
            text: `Listen to this Hebrew audio narration carefully. For each phrase below, tell me the exact timestamp (in seconds) when it is spoken.

${labelList}

Respond ONLY in this exact format, one per line:
1. [seconds]
2. [seconds]
3. [seconds]

Example:
1. 12.5
2. 34.0
3. 67.2

Give only the numbers, no other text.`,
          },
        ],
      },
    ],
  });

  const text = response.text ?? "";
  console.log("Gemini timestamp response:", text);

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

export interface SoundEffect {
  label: string;
  prompt: string;
  position: number; // 0-1 ratio or exact seconds (interpreted by caller)
}

export interface SoundDesign {
  ambientPrompt: string;
  effects: SoundEffect[];
}

export function parseSoundDesign(ttsScript: string): SoundDesign | null {
  const soundMarker = "### עיצוב סאונד";
  const soundIdx = ttsScript.indexOf(soundMarker);
  if (soundIdx === -1) return null;

  const soundSection = ttsScript.slice(soundIdx + soundMarker.length);

  const ambientMatch = soundSection.match(/אווירה:\s*(.+)/);

  console.log("Sound design section:", soundSection.slice(0, 500));

  // Match: * [hebrew quote] - english description  OR  * hebrew quote - english description
  const effectsRegex = /(?:\*|-|•)\s*(?:\[)?([^\]\-–—\n]+?)(?:\])?\s*[-–—]\s*(.+)/g;
  const effects: SoundEffect[] = [];
  let match;
  while ((match = effectsRegex.exec(soundSection)) !== null) {
    const label = match[1].trim();
    const prompt = match[2].trim();
    // Skip the note line
    if (label.startsWith("חוקי") || label.startsWith("הערה") || label.startsWith("תיאור")) continue;

    effects.push({ label, prompt, position: 0 }); // position will be set by audio analysis
  }

  console.log(
    "Parsed effects:",
    effects.length,
    effects.map((e) => `${e.label}: ${e.prompt.slice(0, 40)}`)
  );

  return {
    ambientPrompt:
      ambientMatch?.[1]?.trim() ||
      "Peaceful nighttime sounds with gentle lullaby music, soft piano, crickets, soft breeze",
    effects,
  };
}
