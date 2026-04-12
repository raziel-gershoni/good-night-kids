import { NextResponse } from "next/server";
import {
  generateAmbientSound,
  parseAmbientPrompt,
} from "@/lib/sounds/ambient";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { ttsScript } = await request.json();

    const ambientPrompt = parseAmbientPrompt(ttsScript);
    if (!ambientPrompt) {
      return NextResponse.json(
        { error: "No sound design section found" },
        { status: 400 }
      );
    }

    console.log("Generating ambient:", ambientPrompt.slice(0, 80));

    const ambientBuffer = await generateAmbientSound(ambientPrompt);

    return NextResponse.json({
      ambientBase64: ambientBuffer?.toString("base64") ?? null,
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
