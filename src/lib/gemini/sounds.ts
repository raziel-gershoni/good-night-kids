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

  // Log the section for debugging
  console.log("Sound design section:", soundSection.slice(0, 500));

  // Flexible regex: handles *, -, •, or numbered bullets, and [] or "" or no brackets
  const effectsRegex = /(?:\*|-|•|\d+\.)\s*[\["\u201c](.+?)[\]"\u201d]\s*[-–—:]\s*(.+)/g;
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
