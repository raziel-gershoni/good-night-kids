import { NextResponse } from "next/server";
import { generateAllSounds } from "@/lib/sounds/ambient";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const storyText = formData.get("storyText") as string;
    const narrationFile = formData.get("narration") as File | null;

    if (!storyText) {
      return NextResponse.json(
        { error: "Missing story text" },
        { status: 400 }
      );
    }

    // Convert narration file to base64 if provided
    let narrationBase64: string | undefined;
    if (narrationFile) {
      const arrayBuffer = await narrationFile.arrayBuffer();
      narrationBase64 = Buffer.from(arrayBuffer).toString("base64");
      console.log("Narration size:", arrayBuffer.byteLength, "bytes");
    }

    const result = await generateAllSounds({
      storyText,
      narrationBase64,
    });

    return NextResponse.json({
      ...result,
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
