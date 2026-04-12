const DICTA_API = "https://nakdan-u1-0.loadbalancer.dicta.org.il/api";

interface DictaWord {
  word: string;
  sep: boolean;
  options: string[];
  fpasuk: boolean;
  fconfident: boolean;
}

// Placeholder character range for audio tags
const PLACEHOLDER_BASE = "\uFFF0";

function makePlaceholder(index: number): string {
  return `${PLACEHOLDER_BASE}${index}${PLACEHOLDER_BASE}`;
}

/**
 * Extract audio tags [like this] from text, replace with placeholders.
 * Returns cleaned text and a map to restore tags after nikud.
 */
function extractAudioTags(text: string): {
  cleanedText: string;
  tags: Map<number, { tag: string; position: number }>;
} {
  const tags = new Map<number, { tag: string; position: number }>();
  let index = 0;
  let offset = 0;

  const cleanedText = text.replace(/\[[^\]]+\]/g, (match, matchPosition) => {
    const placeholder = makePlaceholder(index);
    tags.set(index, { tag: match, position: matchPosition - offset });
    offset += match.length - placeholder.length;
    index++;
    return placeholder;
  });

  return { cleanedText, tags };
}

/**
 * Reinsert audio tags into vocalized text by finding placeholders.
 */
function reinsertAudioTags(
  vocalizedText: string,
  tags: Map<number, { tag: string }>
): string {
  let result = vocalizedText;
  for (const [index, { tag }] of tags) {
    const placeholder = makePlaceholder(index);
    result = result.replace(placeholder, tag);
  }
  return result;
}

/**
 * Reconstruct vocalized text from Dicta API response.
 * Takes the first (best) option for each word.
 */
function reconstructFromDicta(words: DictaWord[]): string {
  return words
    .map((w) => {
      if (w.sep) return w.word; // whitespace/separator
      if (w.options.length === 0) return w.word; // no options, keep original
      return w.options[0]; // best nikud option
    })
    .join("");
}

/**
 * Vocalize Hebrew text using Dicta Nakdan API.
 * Preserves ElevenLabs v3 audio tags through the round-trip.
 *
 * CRITICAL: If Dicta fails, this throws - never falls through to unvocalized text.
 */
export async function vocalizeText(
  text: string,
  genre: "modern" | "poetry" | "rabbinic" = "modern"
): Promise<string> {
  // Step 1: Extract audio tags and replace with placeholders
  const { cleanedText, tags } = extractAudioTags(text);

  // Step 2: Send to Dicta for nikud
  const response = await fetch(DICTA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: cleanedText, genre }),
  });

  if (!response.ok) {
    throw new Error(
      `Dicta Nakdan API error: ${response.status} ${response.statusText}`
    );
  }

  const words: DictaWord[] = await response.json();

  if (!Array.isArray(words)) {
    throw new Error("Dicta Nakdan returned unexpected response format");
  }

  // Step 3: Reconstruct vocalized text
  const vocalizedText = reconstructFromDicta(words);

  // Step 4: Reinsert audio tags
  const finalText = reinsertAudioTags(vocalizedText, tags);

  // Step 5: Verify all tags survived the round-trip
  const originalTagCount = (text.match(/\[[^\]]+\]/g) || []).length;
  const finalTagCount = (finalText.match(/\[[^\]]+\]/g) || []).length;

  if (originalTagCount !== finalTagCount) {
    console.warn(
      `Audio tag count mismatch: ${originalTagCount} in original, ${finalTagCount} after nikud. Some tags may have been lost.`
    );
  }

  return finalText;
}
