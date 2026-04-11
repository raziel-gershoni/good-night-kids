import { NextResponse } from "next/server";
import {
  generateBackgroundMusic,
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
      music: soundDesign.musicPrompt.slice(0, 80),
      ambient: soundDesign.ambientPrompt.slice(0, 80),
      effects: soundDesign.effects.length,
    });

    // Generate music and ambient in parallel
    const [musicBuffer, ambientBuffer] = await Promise.all([
      generateBackgroundMusic(soundDesign.musicPrompt),
      generateAmbientSound(soundDesign.ambientPrompt),
    ]);

    // Generate effects in parallel
    const effectBuffers = await Promise.all(
      soundDesign.effects.slice(0, 4).map((e) => generateSoundEffect(e.prompt))
    );

    return NextResponse.json({
      musicBase64: musicBuffer.toString("base64"),
      ambientBase64: ambientBuffer.toString("base64"),
      effects: soundDesign.effects.slice(0, 4).map((e, i) => ({
        label: e.label,
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
