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

export async function generateAmbientSound(prompt: string): Promise<Buffer> {
  return generateAudioClip(prompt);
}

export async function generateSoundEffect(prompt: string): Promise<Buffer> {
  return generateAudioClip(prompt);
}

export interface SoundEffect {
  label: string;
  prompt: string;
  position: number; // 0-1 ratio in the story
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

  // Extract story text (everything between ## הסיפור and ### עיצוב סאונד)
  const storyMarker = "## הסיפור";
  const storyStart = ttsScript.indexOf(storyMarker);
  const storyText = storyStart !== -1
    ? ttsScript.slice(storyStart + storyMarker.length, soundIdx).trim()
    : "";
  const storyLength = storyText.length;

  const ambientMatch = soundSection.match(/אווירה:\s*(.+)/);

  const effectsRegex = /\*\s*\[(.+?)\]\s*-\s*(.+)/g;
  const effects: SoundEffect[] = [];
  let match;
  while ((match = effectsRegex.exec(soundSection)) !== null) {
    const label = match[1].trim();
    const prompt = match[2].trim();

    let position = 0.5;
    if (storyLength > 0) {
      const labelIdx = storyText.indexOf(label);
      if (labelIdx !== -1) {
        position = labelIdx / storyLength;
      }
    }

    effects.push({ label, prompt, position });
  }

  return {
    ambientPrompt: ambientMatch?.[1]?.trim() || "Peaceful nighttime sounds with gentle lullaby music, soft piano, crickets, soft breeze",
    effects,
  };
}
