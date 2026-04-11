import { NextResponse } from "next/server";
import { directStory } from "@/lib/gemini/direct";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { childrenStory, model, thinkingLevel } = await request.json();

    if (!childrenStory?.trim()) {
      return NextResponse.json(
        { error: "Missing children story" },
        { status: 400 }
      );
    }

    const ttsScript = await directStory({
      childrenStory,
      model: model || "gemini-2.5-flash",
      thinkingLevel: thinkingLevel || "none",
    });

    return NextResponse.json({ ttsScript });
  } catch (error) {
    console.error("Direction generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate directions" },
      { status: 500 }
    );
  }
}
