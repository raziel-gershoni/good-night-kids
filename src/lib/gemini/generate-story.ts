import { getGeminiClient } from "./client";
import { STORY_SYSTEM_PROMPT, SOURCE_LABELS } from "../prompts/story-system";
import type { GeminiModel, EffortLevel, SourceType } from "../types";

import { ThinkingLevel } from "@google/genai";

// Gemini 3.1 uses thinkingLevel enum, not thinkingBudget
const THINKING_LEVELS: Record<EffortLevel, ThinkingLevel> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
  max: ThinkingLevel.HIGH,
};

export async function generateStoryGemini(params: {
  originalText: string;
  sourceType: SourceType;
  model: GeminiModel;
  effort: EffortLevel;
}): Promise<string> {
  const ai = getGeminiClient();
  const sourceLabel = SOURCE_LABELS[params.sourceType] || SOURCE_LABELS.other;

  const response = await ai.models.generateContent({
    model: params.model,
    contents: `המקור הוא ${sourceLabel}.\n\nעבד את הטקסט הבא לסיפור שינה לילדים:\n\n${params.originalText}`,
    config: {
      systemInstruction: STORY_SYSTEM_PROMPT,
      thinkingConfig: {
        thinkingLevel: THINKING_LEVELS[params.effort],
      },
    },
  });

  return response.text ?? "";
}
