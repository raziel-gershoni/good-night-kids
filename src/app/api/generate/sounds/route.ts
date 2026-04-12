import { NextResponse } from "next/server";
import {
  generateAmbientSound,
  generateSoundEffect,
  parseSoundDesign,
} from "@/lib/gemini/sounds";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { ttsScript } = await request.json();

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
    });

    // Generate ambient (may fail - non-blocking)
    const ambientBuffer = await generateAmbientSound(soundDesign.ambientPrompt);

    // Generate effects sequentially (ElevenLabs rate limit)
    const effectResults: { label: string; position: number; audioBase64: string }[] = [];
    for (const e of effectsToGenerate) {
      try {
        const buf = await generateSoundEffect(e.prompt);
        effectResults.push({
          label: e.label,
          position: e.position,
          audioBase64: buf.toString("base64"),
        });
      } catch (err) {
        console.error(`Effect "${e.label}" failed:`, err);
      }
    }

    return NextResponse.json({
      ambientBase64: ambientBuffer?.toString("base64") ?? null,
      effects: effectResults,
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
