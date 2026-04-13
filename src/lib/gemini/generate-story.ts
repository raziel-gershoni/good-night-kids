import { getGeminiClient } from "./client";
import { STORY_SYSTEM_PROMPT, SOURCE_LABELS } from "../prompts/story-system";
import type { GeminiModel, SourceType } from "../types";

export async function generateStoryGemini(params: {
  originalText: string;
  sourceType: SourceType;
  model: GeminiModel;
}): Promise<string> {
  const ai = getGeminiClient();
  const sourceLabel = SOURCE_LABELS[params.sourceType] || SOURCE_LABELS.other;

  const response = await ai.models.generateContent({
    model: params.model,
    contents: `המקור הוא ${sourceLabel}.\n\nעבד את הטקסט הבא לסיפור שינה לילדים:\n\n${params.originalText}`,
    config: {
      systemInstruction: STORY_SYSTEM_PROMPT,
    },
  });

  return response.text ?? "";
}
