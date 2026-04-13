import { NextResponse } from "next/server";
import {
  generateAmbientSound,
  generateSfx,
  findEffectTimestamps,
} from "@/lib/sounds/ambient";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Mode 1: Ambient only (JSON)
    if (contentType.includes("application/json")) {
      const { mode, ambientPrompt, effects, narrationBase64 } = await request.json();

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
        console.log("Generating effects:", effectList.length);

        // Timestamp analysis
        let timestamps = new Map<string, number>();
        if (narrationBase64 && effectList.length > 0) {
          try {
            timestamps = await findEffectTimestamps(
              narrationBase64,
              effectList.map((e) => e.label)
            );
            console.log("Timestamps:", Object.fromEntries(timestamps));
          } catch (err) {
            console.error("Timestamp analysis failed:", err);
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
    }

    // Mode 2: FormData with narration file (legacy)
    const formData = await request.formData();
    const storyText = formData.get("storyText") as string;
    const narrationFile = formData.get("narration") as File | null;

    let narrationBase64: string | undefined;
    if (narrationFile) {
      const ab = await narrationFile.arrayBuffer();
      narrationBase64 = Buffer.from(ab).toString("base64");
    }

    // Import parseSoundDesign for legacy mode
    const { parseSoundDesign, generateAllSounds } = await import("@/lib/sounds/ambient");
    const result = await generateAllSounds({ storyText: storyText || "", narrationBase64 });
    return NextResponse.json({ ...result, mimeType: "audio/mp3" });
  } catch (error) {
    console.error("Sound generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sounds" },
      { status: 500 }
    );
  }
}
