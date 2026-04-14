import { NextResponse } from "next/server";
import { generateAmbientSound, generateSfx } from "@/lib/sounds/ambient";
import { findPhraseTimestamp, type TtsAlignment } from "@/lib/tts/elevenlabs";
import { getClaudeClient } from "@/lib/claude/client";

export const maxDuration = 300;

/**
 * Ask LLM to find exact quotes from the story text for each effect.
 * The LLM sees the actual story and copies verbatim phrases.
 */
async function findEffectPhrases(
  storyText: string,
  effects: { label: string; prompt: string }[]
): Promise<Map<string, string>> {
  const client = getClaudeClient();

  const effectList = effects
    .map((e, i) => `${i + 1}. ${e.prompt} (context: ${e.label})`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Here is a Hebrew story text:

${storyText}

For each sound effect below, find the EXACT 2-4 word phrase from the story above where this sound should play. Copy the words EXACTLY as they appear in the story, character for character.

${effectList}

Respond ONLY in this format, one per line:
1. [exact phrase from story]
2. [exact phrase from story]

Example:
1. יצא בדרכו אל
2. שני תאומים חמודים

IMPORTANT: Copy words exactly from the story text above. Do not paraphrase. Do not use biblical Hebrew. Do not add nikud.`,
      },
    ],
  });

  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text + "\n";
    }
  }

  console.log("LLM phrase response:", text);

  const phrases = new Map<string, string>();
  const lines = text.trim().split("\n");
  for (const line of lines) {
    const match = line.match(/(\d+)\.\s*(.+)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < effects.length) {
        phrases.set(effects[idx].label, match[2].trim());
      }
    }
  }

  return phrases;
}

export async function POST(request: Request) {
  try {
    const { mode, ambientPrompt, effects, alignment } = await request.json();

    if (mode === "ambient") {
      console.log("Generating ambient:", ambientPrompt?.slice(0, 80));
      const buffer = await generateAmbientSound(ambientPrompt);
      return NextResponse.json({
        audioBase64: buffer?.toString("base64") ?? null,
        mimeType: "audio/mp3",
      });
    }

    if (mode === "effects") {
      const effectList: { label: string; prompt: string }[] = effects || [];
      const ttsAlignment: TtsAlignment | null = alignment || null;
      console.log("Generating effects:", effectList.length, "hasAlignment:", !!ttsAlignment);

      const timestamps = new Map<string, number>();

      if (ttsAlignment && effectList.length > 0) {
        // Step 1: Get the actual story text from alignment
        const storyText = ttsAlignment.characters.join("")
          .replace(/\[.*?\]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        console.log("Story text from alignment:", storyText.slice(0, 150));

        // Step 2: Ask LLM to find exact phrases from the story
        try {
          const phrases = await findEffectPhrases(storyText, effectList);
          console.log("LLM phrases:", Object.fromEntries(phrases));

          // Step 3: Match those phrases against alignment
          for (const e of effectList) {
            const phrase = phrases.get(e.label);
            if (phrase) {
              const time = findPhraseTimestamp(ttsAlignment, phrase);
              if (time !== null) {
                timestamps.set(e.label, time);
                console.log(`Timestamp for "${e.label}" via phrase "${phrase}": ${time.toFixed(2)}s`);
              } else {
                console.log(`Phrase "${phrase}" not found in alignment for "${e.label}"`);
              }
            }
          }
        } catch (err) {
          console.error("LLM phrase finding failed:", err);
        }
      }

      // Generate effects sequentially
      const results: { label: string; prompt: string; timestampSeconds: number | null; audioBase64: string }[] = [];
      for (const e of effectList.slice(0, 10)) {
        try {
          const buf = await generateSfx(e.prompt);
          results.push({
            label: e.label,
            prompt: e.prompt,
            timestampSeconds: timestamps.get(e.label) ?? null,
            audioBase64: buf.toString("base64"),
          });
        } catch (err) {
          console.error(`Effect "${e.label}" failed:`, err);
        }
      }

      return NextResponse.json({ effects: results, mimeType: "audio/mp3" });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Sound generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sounds" },
      { status: 500 }
    );
  }
}
