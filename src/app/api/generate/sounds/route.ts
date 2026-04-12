import { NextResponse } from "next/server";
import {
  generateAmbientSound,
  generateSoundEffect,
  parseSoundDesign,
  findEffectTimestamps,
} from "@/lib/gemini/sounds";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const ttsScript = formData.get("ttsScript") as string;
    const narrationFile = formData.get("narration") as File | null;

    const soundDesign = parseSoundDesign(ttsScript);
    if (!soundDesign) {
      return NextResponse.json(
        { error: "No sound design section found" },
        { status: 400 }
      );
    }

    const effectsToGenerate = soundDesign.effects.slice(0, 6);

    console.log("Generating sounds:", {
      ambient: soundDesign.ambientPrompt.slice(0, 80),
      effects: effectsToGenerate.length,
      hasNarration: !!narrationFile,
    });

    // Step 1: Find exact timestamps via Gemini audio analysis
    let timestamps = new Map<string, number>();
    if (narrationFile && effectsToGenerate.length > 0) {
      try {
        const arrayBuffer = await narrationFile.arrayBuffer();
        const narrationBase64 = Buffer.from(arrayBuffer).toString("base64");
        timestamps = await findEffectTimestamps(
          narrationBase64,
          effectsToGenerate.map((e) => e.label)
        );
        console.log("Found timestamps:", Object.fromEntries(timestamps));
      } catch (err) {
        console.error("Timestamp analysis failed, using fallback:", err);
      }
    }

    // Step 2: Generate ambient
    const ambientBuffer = await generateAmbientSound(soundDesign.ambientPrompt);

    // Step 3: Generate effects sequentially (ElevenLabs rate limit)
    const effectBuffers: Buffer[] = [];
    for (const e of effectsToGenerate) {
      const buf = await generateSoundEffect(e.prompt);
      effectBuffers.push(buf);
    }

    return NextResponse.json({
      ambientBase64: ambientBuffer.toString("base64"),
      effects: effectsToGenerate.map((e, i) => ({
        label: e.label,
        timestampSeconds: timestamps.get(e.label) ?? null,
        fallbackPosition: (i + 1) / (effectsToGenerate.length + 1),
        audioBase64: effectBuffers[i].toString("base64"),
      })),
      mimeType: "audio/mp3",
    });
  } catch (error) {
    console.error("Sound generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sounds" },
      { status: 500 }
    );
  }
}
