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
 * Find the timestamp (in seconds) when a phrase starts in the TTS output.
 * Uses character-level alignment from ElevenLabs.
 */
export function findPhraseTimestamp(
  alignment: TtsAlignment,
  phrase: string
): number | null {
  // Reconstruct the full text from alignment characters
  const fullText = alignment.characters.join("");

  // Find the phrase in the full text (try with and without nikud)
  const cleanPhrase = phrase.replace(/[\u0591-\u05C7]/g, "");
  const cleanText = fullText.replace(/[\u0591-\u05C7]/g, "");

  let charIdx = cleanText.indexOf(cleanPhrase);
  if (charIdx === -1) {
    // Try fuzzy: just first few words
    const shortPhrase = cleanPhrase.split(/\s+/).slice(0, 2).join(" ");
    if (shortPhrase.length >= 3) {
      charIdx = cleanText.indexOf(shortPhrase);
    }
  }

  if (charIdx === -1) return null;

  // Map clean text index back to original alignment index
  let cleanIdx = 0;
  for (let i = 0; i < alignment.characters.length; i++) {
    const cleanChar = alignment.characters[i].replace(/[\u0591-\u05C7]/g, "");
    if (cleanIdx === charIdx && cleanChar.length > 0) {
      return alignment.character_start_times_seconds[i];
    }
    cleanIdx += cleanChar.length;
  }

  return null;
}
