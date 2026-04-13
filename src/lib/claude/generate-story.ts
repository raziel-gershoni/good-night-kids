import { getClaudeClient } from "./client";
import type Anthropic from "@anthropic-ai/sdk";
import { STORY_SYSTEM_PROMPT, SOURCE_LABELS } from "../prompts/story-system";
import type { ClaudeModel, EffortLevel, SourceType } from "../types";

export async function generateStory(params: {
  originalText: string;
  sourceType: SourceType;
  model: ClaudeModel;
  effort: EffortLevel;
}): Promise<string> {
  const client = getClaudeClient();
  const sourceLabel = SOURCE_LABELS[params.sourceType] || SOURCE_LABELS.other;

  const response = await client.messages.create({
    model: params.model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: params.effort },
    system: STORY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `המקור הוא ${sourceLabel}.\n\nעבד את הטקסט הבא לסיפור שינה לילדים:\n\n${params.originalText}`,
      },
    ],
  } as unknown as Anthropic.MessageCreateParamsNonStreaming);

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  return textBlocks.map((b) => b.text).join("\n") || "";
}
