import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/tts/elevenlabs";
import { generateSpeechGemini } from "@/lib/tts/gemini-tts";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { ttsScript, voiceId, ttsEngine } = await request.json();

    if (!ttsScript?.trim()) {
      return NextResponse.json(
        { error: "Missing TTS script" },
        { status: 400 }
      );
    }

    // Strip sound design section and any [tags] only for clean text
    const soundMarker = "### עיצוב סאונד";
    const soundIdx = ttsScript.indexOf(soundMarker);
    const textForTts = soundIdx !== -1 ? ttsScript.slice(0, soundIdx).trim() : ttsScript;

    console.log("TTS engine:", ttsEngine || "elevenlabs");
    console.log("TTS text length:", textForTts.length);

    if (ttsEngine === "gemini") {
      // Gemini TTS - keep audio tags, they work with this engine
      const audioBuffer = await generateSpeechGemini({
        text: textForTts,
        voiceName: voiceId || "Aoede",
      });

      return NextResponse.json({
        audioBase64: audioBuffer.toString("base64"),
        alignment: null, // Gemini TTS doesn't return alignment
        mimeType: "audio/wav",
      });
    }

    // ElevenLabs - strip [tags] since they don't work with custom voices
    const cleanText = textForTts.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();

    const { audioBuffer, alignment } = await generateSpeech({
      text: cleanText,
      voiceId: voiceId || "owHnXhz2H7U5Cv31srDU",
    });

    return NextResponse.json({
      audioBase64: audioBuffer.toString("base64"),
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
