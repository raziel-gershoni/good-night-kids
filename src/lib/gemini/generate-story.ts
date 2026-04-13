import { getGeminiClient } from "./client";
import { STORY_SYSTEM_PROMPT, SOURCE_LABELS } from "../prompts/story-system";
import type { GeminiModel, EffortLevel, SourceType } from "../types";

const THINKING_BUDGETS: Record<EffortLevel, number | undefined> = {
  low: 1024,
  medium: 4096,
  high: 16384,
  max: 32768,
};

export async function generateStoryGemini(params: {
  originalText: string;
  sourceType: SourceType;
  model: GeminiModel;
  effort: EffortLevel;
}): Promise<string> {
  const ai = getGeminiClient();
  const sourceLabel = SOURCE_LABELS[params.sourceType] || SOURCE_LABELS.other;
  const budget = THINKING_BUDGETS[params.effort];

  const response = await ai.models.generateContent({
    model: params.model,
    contents: `המקור הוא ${sourceLabel}.\n\nעבד את הטקסט הבא לסיפור שינה לילדים:\n\n${params.originalText}`,
    config: {
      systemInstruction: STORY_SYSTEM_PROMPT,
      thinkingConfig: budget ? { thinkingBudget: budget } : undefined,
    },
  });

  return response.text ?? "";
}
