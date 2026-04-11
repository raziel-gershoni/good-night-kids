import { NextResponse } from "next/server";
import { narrateStory } from "@/lib/gemini/narrate";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { ttsScript, voiceName } = await request.json();

    if (!ttsScript?.trim()) {
      return NextResponse.json(
        { error: "Missing TTS script" },
        { status: 400 }
      );
    }

    const { audioBuffer, mimeType } = await narrateStory({
      ttsScript,
      voiceName: voiceName || "Kore",
    });

    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({ audioBase64, mimeType });
  } catch (error) {
    console.error("Narration generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate narration" },
      { status: 500 }
    );
  }
}
