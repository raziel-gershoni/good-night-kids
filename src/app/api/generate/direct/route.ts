import { NextResponse } from "next/server";
import { vocalizeText } from "@/lib/nikud/dicta";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { childrenStory } = await request.json();

    if (!childrenStory?.trim()) {
      return NextResponse.json(
        { error: "Missing story text" },
        { status: 400 }
      );
    }

    // Dicta Nakdan: add nikud while preserving audio tags
    // This MUST NOT fail silently - if Dicta errors, the pipeline halts
    const vocalizedStory = await vocalizeText(childrenStory);

    return NextResponse.json({ ttsScript: vocalizedStory });
  } catch (error) {
    console.error("Vocalization error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Vocalization failed: ${error.message}`
            : "Failed to vocalize text",
      },
      { status: 500 }
    );
  }
}
