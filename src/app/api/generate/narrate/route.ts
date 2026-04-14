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

    // Strip sound design section and any [tags] before sending to TTS
    const soundMarker = "### עיצוב סאונד";
    const soundIdx = ttsScript.indexOf(soundMarker);
    let textForTts = soundIdx !== -1 ? ttsScript.slice(0, soundIdx).trim() : ttsScript;
    textForTts = textForTts.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();

    console.log("=== NARRATE: TTS INPUT ===");
    console.log("Length:", textForTts.length);
    console.log("Full text:", textForTts);

    const { audioBuffer, alignment } = await generateSpeech({
      text: textForTts,
      voiceId: voiceId || "owHnXhz2H7U5Cv31srDU",
    });

    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      audioBase64,
      alignment,
      mimeType: "audio/mpeg",
    });
  } catch (error) {
    console.error("Narration generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate narration" },
      { status: 500 }
    );
  }
}
