import { NextResponse } from "next/server";
import { adaptToChildrenStory } from "@/lib/gemini/adapt";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { originalText, sourceType, model, thinkingLevel } =
      await request.json();

    if (!originalText?.trim()) {
      return NextResponse.json(
        { error: "Missing original text" },
        { status: 400 }
      );
    }

    const childrenStory = await adaptToChildrenStory({
      originalText,
      sourceType: sourceType || "other",
      model: model || "gemini-3.1-flash-lite-preview",
      thinkingLevel: thinkingLevel || "none",
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
