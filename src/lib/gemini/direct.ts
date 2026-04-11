import { getGeminiClient } from "./client";
import { DIRECT_SYSTEM_PROMPT } from "../prompts/direct-system";
import type { GeminiModel, ThinkingLevel } from "../types";

export async function directStory(params: {
  childrenStory: string;
  model: GeminiModel;
  thinkingLevel: ThinkingLevel;
}): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: params.model,
    contents: params.childrenStory,
    config: {
      systemInstruction: DIRECT_SYSTEM_PROMPT,
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
