import { z } from "zod";
import { ThinkingLevel } from "@google/genai";
import { getGeminiClient } from "../gemini/client";
import type { GeminiModel, EffortLevel } from "../types";

const THINKING_LEVELS: Record<EffortLevel, ThinkingLevel> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
  max: ThinkingLevel.HIGH,
};

interface GenerateValidatedJsonParams<T> {
  schema: z.ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
  model: GeminiModel;
  effort: EffortLevel;
  maxRetries?: number;
}

export class JsonValidationError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastRawResponse: string,
  ) {
    super(message);
    this.name = "JsonValidationError";
  }
}

export async function generateValidatedJson<T>({
  schema,
  systemPrompt,
  userPrompt,
  model,
  effort,
  maxRetries = 2,
}: GenerateValidatedJsonParams<T>): Promise<T> {
  const ai = getGeminiClient();
  let lastRaw = "";
  let lastError = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const contents =
      attempt === 0
        ? userPrompt
        : `${userPrompt}\n\n---\n\nתשובתך הקודמת הייתה:\n${lastRaw}\n\nהיא נכשלה באימות עם השגיאה:\n${lastError}\n\nהחזר אך ורק JSON תקין שעומד בסכמה. אין הסברים, אין markdown, אין טקסט נוסף.`;

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: THINKING_LEVELS[effort] },
      },
    });

    lastRaw = (response.text ?? "").trim();
    const cleaned = stripJsonFence(lastRaw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      lastError = `JSON.parse failed: ${(e as Error).message}`;
      console.warn(`[validated-json] attempt ${attempt + 1} parse failed: ${lastError}`);
      continue;
    }

    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    lastError = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    console.warn(`[validated-json] attempt ${attempt + 1} schema invalid: ${lastError}`);
  }

  throw new JsonValidationError(
    `LLM returned invalid JSON after ${maxRetries + 1} attempts. Last error: ${lastError}`,
    maxRetries + 1,
    lastRaw,
  );
}

function stripJsonFence(s: string): string {
  const fenced = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : s;
}
