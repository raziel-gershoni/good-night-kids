import { NextResponse } from "next/server";
import {
  generateValidatedJson,
  JsonValidationError,
} from "@/lib/llm/validated-json";
import { parashaIdeaSchema } from "@/lib/llm/schemas";
import { PARASHA_EXTRACT_IDEA_PROMPT } from "@/lib/prompts/parasha-extract-idea";
import type { GeminiModel, EffortLevel, StoryModel } from "@/lib/types";

export const maxDuration = 300;

function isGeminiModel(model: StoryModel): model is GeminiModel {
  return model.startsWith("gemini-");
}

export async function POST(request: Request) {
  try {
    const { parashaName, parashaText, prompt, model, effort } = await request.json();

    if (!parashaText?.trim()) {
      return NextResponse.json({ error: "Missing parasha text" }, { status: 400 });
    }

    const selectedModel: StoryModel = model || "gemini-3.1-flash-lite-preview";
    if (!isGeminiModel(selectedModel)) {
      return NextResponse.json(
        { error: "JSON-validated steps require a Gemini model" },
        { status: 400 },
      );
    }

    const systemPrompt: string = (typeof prompt === "string" && prompt.trim())
      ? prompt
      : PARASHA_EXTRACT_IDEA_PROMPT;

    const userPrompt = `שם הפרשה: ${parashaName ?? "(לא צוין)"}\n\nטקסט הפרשה:\n${parashaText}`;

    const result = await generateValidatedJson({
      schema: parashaIdeaSchema,
      systemPrompt,
      userPrompt,
      model: selectedModel,
      effort: (effort as EffortLevel) || "high",
      maxRetries: 2,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof JsonValidationError) {
      console.error("Extract-idea validation failed:", error.message);
      return NextResponse.json(
        { error: error.message, lastRawResponse: error.lastRawResponse },
        { status: 502 },
      );
    }
    console.error("Extract-idea error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract idea" },
      { status: 500 },
    );
  }
}
