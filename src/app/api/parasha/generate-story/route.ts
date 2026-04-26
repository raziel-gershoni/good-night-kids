import { NextResponse } from "next/server";
import { ThinkingLevel } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";
import { PARASHA_GENERATE_STORY_PROMPT } from "@/lib/prompts/parasha-generate-story";
import type { GeminiModel, EffortLevel, StoryModel } from "@/lib/types";

export const maxDuration = 300;

const THINKING_LEVELS: Record<EffortLevel, ThinkingLevel> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
  max: ThinkingLevel.HIGH,
};

function isGeminiModel(model: StoryModel): model is GeminiModel {
  return model.startsWith("gemini-");
}

export async function POST(request: Request) {
  try {
    const { parashaName, idea, sourceVerses, prompt, model, effort } = await request.json();

    if (!idea?.trim()) {
      return NextResponse.json({ error: "Missing idea" }, { status: 400 });
    }
    if (!Array.isArray(sourceVerses) || sourceVerses.length === 0) {
      return NextResponse.json({ error: "Missing source verses" }, { status: 400 });
    }

    const selectedModel: StoryModel = model || "gemini-3.1-flash-lite-preview";
    if (!isGeminiModel(selectedModel)) {
      return NextResponse.json(
        { error: "Parasha story generation currently requires a Gemini model" },
        { status: 400 },
      );
    }

    const systemPrompt: string = (typeof prompt === "string" && prompt.trim())
      ? prompt
      : PARASHA_GENERATE_STORY_PROMPT;

    const versesBlock = (sourceVerses as { ref: string; text: string }[])
      .map((v) => `- ${v.ref}: ${v.text}`)
      .join("\n");
    const userPrompt = `שם הפרשה: ${parashaName ?? "(לא צוין)"}\n\nהרעיון:\n${idea}\n\nפסוקי המקור:\n${versesBlock}\n\nכתוב את סיפור השינה לפי החוקים.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: THINKING_LEVELS[(effort as EffortLevel) || "high"] },
      },
    });

    const childrenStory = (response.text ?? "").trim();
    if (!childrenStory) {
      return NextResponse.json({ error: "Empty story returned" }, { status: 502 });
    }

    return NextResponse.json({ childrenStory });
  } catch (error) {
    console.error("Parasha story generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate story" },
      { status: 500 },
    );
  }
}
