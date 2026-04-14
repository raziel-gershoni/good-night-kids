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
        console.log("=== EFFECTS: ALIGNMENT TEXT ===");
        console.log("Length:", fullText.length);
        console.log("Full text:", fullText);
        console.log("Last timestamp:", ttsAlignment.character_start_times_seconds.slice(-1)[0]);

        for (const e of effectList) {
          // Show exactly where indexOf finds the phrase
          const matchPos = fullText.indexOf(e.label);
          console.log(`\nSearching: "${e.label}"`);
          console.log(`  indexOf result: ${matchPos}`);
          if (matchPos !== -1) {
            console.log(`  Context: ...${fullText.slice(Math.max(0, matchPos - 20), matchPos)}>>>HERE>>>${fullText.slice(matchPos, matchPos + e.label.length)}<<<${fullText.slice(matchPos + e.label.length, matchPos + e.label.length + 20)}...`);
            console.log(`  Timestamp at pos ${matchPos}: ${ttsAlignment.character_start_times_seconds[matchPos]}`);
          }

          const time = findPhraseTimestamp(ttsAlignment, e.label);
          if (time !== null) {
            timestamps.set(e.label, time);
            console.log(`  → Final timestamp: ${time.toFixed(2)}s`);
          } else {
            console.log(`  → NO TIMESTAMP`);
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
