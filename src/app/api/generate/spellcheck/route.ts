import { NextResponse } from "next/server";
import { spellcheckStory } from "@/lib/gemini/spellcheck";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { childrenStory, model, thinkingLevel } = await request.json();

    if (!childrenStory?.trim()) {
      return NextResponse.json(
        { error: "Missing story text" },
        { status: 400 }
      );
    }

    const correctedStory = await spellcheckStory({
      childrenStory,
      model: model || "gemini-3.1-flash-lite-preview",
      thinkingLevel: thinkingLevel || "none",
    });

    return NextResponse.json({ correctedStory });
  } catch (error) {
    console.error("Spellcheck error:", error);
    return NextResponse.json(
      { error: "Failed to spellcheck story" },
      { status: 500 }
    );
  }
}
