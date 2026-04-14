const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export interface TtsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface TtsResult {
  audioBuffer: Buffer;
  alignment: TtsAlignment;
}

export async function generateSpeech(params: {
  text: string;
  voiceId: string;
}): Promise<TtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  const response = await fetch(
    `${ELEVENLABS_TTS_URL}/${params.voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: params.text,
        model_id: "eleven_v3",
        language_code: "he",
        voice_settings: {
          stability: 0,
          style: 1,
          speed: 1.5,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs TTS error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();

  return {
    audioBuffer: Buffer.from(data.audio_base64, "base64"),
    alignment: data.alignment,
  };
}

/**
 * Find the timestamp when a phrase is spoken.
 * Simple: join alignment chars into full text, find the phrase, map index back to timestamp.
 */
export function findPhraseTimestamp(
  alignment: TtsAlignment,
  phrase: string
): number | null {
  // Strip nikud from both phrase and alignment text
  const strip = (s: string) => s.replace(/[\u0591-\u05C7]/g, "");

  const cleanPhrase = strip(phrase);
  const fullText = alignment.characters.join("");
  const cleanText = strip(fullText);

  const matchIdx = cleanText.indexOf(cleanPhrase);
  if (matchIdx === -1) return null;

  // Map cleanText index back to alignment index
  // Walk through fullText, skipping nikud chars, counting clean chars
  let cleanCount = 0;
  for (let i = 0; i < fullText.length; i++) {
    if (cleanCount === matchIdx) {
      // Find this position in the alignment characters array
      // alignment.characters are individual chars, so position i in fullText = index i in alignment
      return alignment.character_start_times_seconds[i] ?? null;
    }
    const ch = fullText[i];
    if (strip(ch).length > 0) {
      cleanCount++;
    }
  }

  return null;
}
