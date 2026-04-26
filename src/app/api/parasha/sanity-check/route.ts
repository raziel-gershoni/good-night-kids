import { NextResponse } from "next/server";
import {
  generateValidatedJson,
  JsonValidationError,
} from "@/lib/llm/validated-json";
import { sanityReportSchema } from "@/lib/llm/schemas";
import { PARASHA_SANITY_CHECK_PROMPT } from "@/lib/prompts/parasha-sanity-check";
import type { GeminiModel, EffortLevel, StoryModel } from "@/lib/types";

export const maxDuration = 300;

function isGeminiModel(model: StoryModel): model is GeminiModel {
  return model.startsWith("gemini-");
}

export async function POST(request: Request) {
  try {
    const { parashaName, idea, sourceVerses, story, prompt, model, effort } =
      await request.json();

    if (!story?.trim()) {
      return NextResponse.json({ error: "Missing story" }, { status: 400 });
    }
    if (!idea?.trim()) {
      return NextResponse.json({ error: "Missing idea" }, { status: 400 });
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
      : PARASHA_SANITY_CHECK_PROMPT;

    const versesBlock = Array.isArray(sourceVerses)
      ? (sourceVerses as { ref: string; text: string }[])
          .map((v) => `- ${v.ref}: ${v.text}`)
          .join("\n")
      : "(אין פסוקים)";

    const userPrompt = `שם הפרשה: ${parashaName ?? "(לא צוין)"}\n\nהרעיון שאמור להיות מועבר:\n${idea}\n\nפסוקי המקור שניתנו לכותב הסיפור:\n${versesBlock}\n\nהסיפור לבדיקה:\n${story}`;

    const result = await generateValidatedJson({
      schema: sanityReportSchema,
      systemPrompt,
      userPrompt,
      model: selectedModel,
      effort: (effort as EffortLevel) || "high",
      maxRetries: 2,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof JsonValidationError) {
      console.error("Sanity-check validation failed:", error.message);
      return NextResponse.json(
        { error: error.message, lastRawResponse: error.lastRawResponse },
        { status: 502 },
      );
    }
    console.error("Sanity-check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run sanity check" },
      { status: 500 },
    );
  }
}
