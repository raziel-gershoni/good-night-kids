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
  const fullText = alignment.characters.join("");

  // Map from string position to alignment array index
  // Each characters[] element can be 1+ chars (base + combining marks)
  const posToIdx: number[] = [];
  for (let i = 0; i < alignment.characters.length; i++) {
    for (let j = 0; j < alignment.characters[i].length; j++) {
      posToIdx.push(i);
    }
  }

  const matchPos = fullText.indexOf(phrase);
  if (matchPos === -1) return null;

  const arrIdx = posToIdx[matchPos];
  return alignment.character_start_times_seconds[arrIdx] ?? null;
}
