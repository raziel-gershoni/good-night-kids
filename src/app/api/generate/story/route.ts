import { NextResponse } from "next/server";
import { generateStory } from "@/lib/claude/generate-story";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { originalText, sourceType, model, effort } = await request.json();

    if (!originalText?.trim()) {
      return NextResponse.json(
        { error: "Missing original text" },
        { status: 400 }
      );
    }

    const childrenStory = await generateStory({
      originalText,
      sourceType: sourceType || "other",
      model: model || "claude-sonnet-4-6",
      effort: effort || "high",
    });

    return NextResponse.json({ childrenStory });
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
