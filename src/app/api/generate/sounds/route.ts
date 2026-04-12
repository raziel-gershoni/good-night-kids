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

    // Generate ambient
    const ambientBuffer = await generateAmbientSound(soundDesign.ambientPrompt);

    // Generate effects sequentially (ElevenLabs rate limit)
    const effectBuffers: Buffer[] = [];
    for (const e of effectsToGenerate) {
      const buf = await generateSoundEffect(e.prompt);
      effectBuffers.push(buf);
    }

    return NextResponse.json({
      ambientBase64: ambientBuffer.toString("base64"),
      effects: effectsToGenerate.map((e, i) => ({
        label: e.label,
        position: e.position,
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
