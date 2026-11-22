import { getClaudeClient } from "./client";
import type Anthropic from "@anthropic-ai/sdk";
import { STORY_SYSTEM_PROMPT, SOURCE_LABELS } from "../prompts/story-system";
import type { ClaudeModel, EffortLevel, SourceType } from "../types";

// If a safety classifier declines the request, the API re-runs it on a
// fallback model chosen by refusal category, inside the same call
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export async function generateStory(params: {
  originalText: string;
  sourceType: SourceType;
  model: ClaudeModel;
  effort: EffortLevel;
}): Promise<string> {
  const client = getClaudeClient();
  const sourceLabel = SOURCE_LABELS[params.sourceType] || SOURCE_LABELS.other;

  const request: Anthropic.Beta.MessageCreateParamsNonStreaming = {
    model: params.model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: params.effort },
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    system: STORY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `המקור הוא ${sourceLabel}.\n\nעבד את הטקסט הבא לסיפור שינה לילדים:\n\n${params.originalText}`,
      },
    ],
  };

  const response = await client.beta.messages.create(request);

  if (response.model !== params.model) {
    console.warn(`[claude] ${params.model} declined; story written by fallback ${response.model}`);
  }

  // Refusal here means the fallback model declined too
  if (response.stop_reason === "refusal") {
    const details = response.stop_details;
    throw new Error(
      `Claude declined the story (category: ${details?.category ?? "unknown"}): ${details?.explanation ?? ""}`,
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      `Claude story hit the ${request.max_tokens}-token limit (effort ${params.effort}) before finishing`,
    );
  }

  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((b) => b.text)
    .join("\n");

  if (!text.trim()) {
    throw new Error(`Claude returned no story text (stop_reason: ${response.stop_reason})`);
  }
  return text;
}
