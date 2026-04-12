import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/tts/elevenlabs";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { ttsScript, voiceId } = await request.json();

    if (!ttsScript?.trim()) {
      return NextResponse.json(
        { error: "Missing TTS script" },
        { status: 400 }
      );
    }

    const audioBuffer = await generateSpeech({
      text: ttsScript,
      voiceId: voiceId || "JiKFunrRggP9Jl3AcoUw", // Rachel default
    });

    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({ audioBase64, mimeType: "audio/mpeg" });
  } catch (error) {
    console.error("Narration generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate narration" },
      { status: 500 }
    );
  }
}
