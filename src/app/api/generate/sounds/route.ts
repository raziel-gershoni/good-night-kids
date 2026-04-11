import { NextResponse } from "next/server";
import {
  generateAmbientSound,
  generateSoundEffect,
  parseSoundDesign,
} from "@/lib/gemini/sounds";

export const maxDuration = 120;

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

    console.log("Generating sounds:", {
      ambient: soundDesign.ambientPrompt.slice(0, 80),
      effects: soundDesign.effects.length,
    });

    // Generate ambient and all effects in parallel
    const [ambientBuffer, ...effectBuffers] = await Promise.all([
      generateAmbientSound(soundDesign.ambientPrompt),
      ...soundDesign.effects.slice(0, 8).map((e) => generateSoundEffect(e.prompt)),
    ]);

    return NextResponse.json({
      ambientBase64: ambientBuffer.toString("base64"),
      effects: soundDesign.effects.slice(0, 8).map((e, i) => ({
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
