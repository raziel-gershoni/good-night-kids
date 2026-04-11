import { getGeminiClient } from "./client";

async function generateAudioClip(prompt: string): Promise<Buffer> {
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

export async function generateBackgroundMusic(prompt: string): Promise<Buffer> {
  return generateAudioClip(prompt);
}

export async function generateAmbientSound(prompt: string): Promise<Buffer> {
  return generateAudioClip(prompt);
}

export async function generateSoundEffect(prompt: string): Promise<Buffer> {
  return generateAudioClip(prompt);
}

export interface SoundDesign {
  musicPrompt: string;
  ambientPrompt: string;
  effects: { label: string; prompt: string }[];
}

export function parseSoundDesign(ttsScript: string): SoundDesign | null {
  const marker = "### עיצוב סאונד";
  const idx = ttsScript.indexOf(marker);
  if (idx === -1) return null;

  const section = ttsScript.slice(idx + marker.length);

  const musicMatch = section.match(/מוזיקת רקע:\s*(.+)/);
  const ambientMatch = section.match(/אווירה:\s*(.+)/);

  const effectsRegex = /\*\s*\[(.+?)\]\s*-\s*(.+)/g;
  const effects: { label: string; prompt: string }[] = [];
  let match;
  while ((match = effectsRegex.exec(section)) !== null) {
    effects.push({ label: match[1].trim(), prompt: match[2].trim() });
  }

  return {
    musicPrompt: musicMatch?.[1]?.trim() || "Gentle bedtime lullaby, soft piano, 70 BPM, instrumental only, calm and soothing",
    ambientPrompt: ambientMatch?.[1]?.trim() || "Peaceful nighttime sounds, gentle crickets, soft breeze",
    effects,
  };
}
