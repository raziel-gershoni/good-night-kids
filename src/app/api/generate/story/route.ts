import { NextResponse } from "next/server";
import { generateStory } from "@/lib/claude/generate-story";
import { generateStoryGemini } from "@/lib/gemini/generate-story";
import type { StoryModel } from "@/lib/types";

export const maxDuration = 300;

function isGeminiModel(model: StoryModel): boolean {
  return model.startsWith("gemini-");
}

export async function POST(request: Request) {
  try {
    const { originalText, sourceType, model, effort } = await request.json();

    if (!originalText?.trim()) {
      return NextResponse.json(
        { error: "Missing original text" },
        { status: 400 }
      );
    }

    const selectedModel: StoryModel = model || "claude-sonnet-4-6";
    let childrenStory: string;

    if (isGeminiModel(selectedModel)) {
      childrenStory = await generateStoryGemini({
        originalText,
        sourceType: sourceType || "other",
        model: selectedModel as "gemini-3.1-flash-lite-preview" | "gemini-3.1-pro-preview",
      });
    } else {
      childrenStory = await generateStory({
        originalText,
        sourceType: sourceType || "other",
        model: selectedModel as "claude-sonnet-4-6" | "claude-opus-4-6",
        effort: effort || "high",
      });
    }

    return NextResponse.json({ childrenStory });
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
