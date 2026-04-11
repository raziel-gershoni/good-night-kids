import { getGeminiClient } from "./client";
import { SPELLCHECK_SYSTEM_PROMPT } from "../prompts/spellcheck-system";
import type { GeminiModel, ThinkingLevel } from "../types";

export async function spellcheckStory(params: {
  childrenStory: string;
  model: GeminiModel;
  thinkingLevel: ThinkingLevel;
}): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: params.model,
    contents: params.childrenStory,
    config: {
      systemInstruction: SPELLCHECK_SYSTEM_PROMPT,
      thinkingConfig:
        params.thinkingLevel !== "none"
          ? { thinkingBudget: getThinkingBudget(params.thinkingLevel) }
          : undefined,
    },
  });

  return response.text ?? params.childrenStory;
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
