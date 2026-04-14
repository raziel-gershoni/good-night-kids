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
 * Strip nikud and audio tags from text for matching
 */
function normalize(text: string): string {
  return text
    .replace(/[\u0591-\u05C7]/g, "") // strip nikud
    .replace(/\[.*?\]/g, "")         // strip [tags]
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find the timestamp (in seconds) when a phrase starts in the TTS output.
 * Uses character-level alignment from ElevenLabs.
 */
export function findPhraseTimestamp(
  alignment: TtsAlignment,
  phrase: string
): number | null {
  const cleanPhrase = normalize(phrase);
  const words = cleanPhrase.split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return null;

  // Build a clean version of the text with index mapping back to alignment
  // Each entry: { cleanChar, alignmentIndex }
  const mapped: { char: string; alignIdx: number }[] = [];
  let inTag = false;
  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    if (ch === "[") { inTag = true; continue; }
    if (ch === "]") { inTag = false; continue; }
    if (inTag) continue;
    // Strip nikud
    const clean = ch.replace(/[\u0591-\u05C7]/g, "");
    if (clean) {
      mapped.push({ char: clean, alignIdx: i });
    }
  }

  const cleanText = mapped.map(m => m.char).join("");

  // Try full phrase first
  let matchIdx = cleanText.indexOf(cleanPhrase);

  // Try each word if full phrase not found
  if (matchIdx === -1) {
    for (const word of words) {
      matchIdx = cleanText.indexOf(word);
      if (matchIdx !== -1) {
        console.log(`  Matched word "${word}" at cleanIdx ${matchIdx}`);
        break;
      }
    }
  }

  if (matchIdx === -1) {
    console.log(`  No match for "${cleanPhrase}" (words: ${words.join(", ")})`);
    return null;
  }

  // Map back to alignment index
  const alignIdx = mapped[matchIdx]?.alignIdx;
  if (alignIdx === undefined) return null;

  const timestamp = alignment.character_start_times_seconds[alignIdx];
  console.log(`  Found at alignIdx ${alignIdx}, timestamp ${timestamp?.toFixed(2)}s`);
  return timestamp ?? null;
}
