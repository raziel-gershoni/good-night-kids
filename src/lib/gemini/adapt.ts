import { getGeminiClient } from "./client";
import { getAdaptSystemPrompt } from "../prompts/adapt-system";
import type { GeminiModel, ThinkingLevel } from "../types";

export async function adaptToChildrenStory(params: {
  originalText: string;
  sourceType: string;
  model: GeminiModel;
  thinkingLevel: ThinkingLevel;
}): Promise<string> {
  const ai = getGeminiClient();
  const systemPrompt = getAdaptSystemPrompt(params.sourceType);

  const response = await ai.models.generateContent({
    model: params.model,
    contents: params.originalText,
    config: {
      systemInstruction: systemPrompt,
      thinkingConfig:
        params.thinkingLevel !== "none"
          ? { thinkingBudget: getThinkingBudget(params.thinkingLevel) }
          : undefined,
    },
  });

  return response.text ?? "";
}

function getThinkingBudget(level: ThinkingLevel): number {
  switch (level) {
    case "low":
      return 1024;
    case "medium":
      return 4096;
    case "high":
      return 16384;
    default:
      return 0;
  }
}
