import { NextResponse } from "next/server";
import { generateAmbientSound, generateSfx } from "@/lib/sounds/ambient";
import { findPhraseTimestamp, type TtsAlignment } from "@/lib/tts/elevenlabs";

export const maxDuration = 300;

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

      // Find timestamps from TTS alignment data
      const timestamps = new Map<string, number>();
      if (ttsAlignment) {
        const fullText = ttsAlignment.characters.join("");
        console.log("Alignment text preview:", fullText.replace(/\[.*?\]/g, "").slice(0, 150));

        for (const e of effectList) {
          const time = findPhraseTimestamp(ttsAlignment, e.label);
          if (time !== null) {
            timestamps.set(e.label, time);
            console.log(`Timestamp for "${e.label}": ${time.toFixed(2)}s`);
          } else {
            console.log(`No timestamp found for "${e.label}"`);
          }
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
