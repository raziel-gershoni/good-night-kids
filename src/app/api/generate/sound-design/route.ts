import { NextResponse } from "next/server";
import { getClaudeClient } from "@/lib/claude/client";

export const maxDuration = 300;

const PROMPT = `Given a Hebrew children's bedtime story, generate a SHORT ambient background sound description in English (max 8 words) for a sound effects model.

Examples:
- "soft piano lullaby with crickets at night"
- "gentle oud melody with desert wind"
- "calm harp music with rain sounds"
- "warm acoustic guitar with forest birds"

Output format (exactly):
אווירה: [your description]`;

export async function POST(request: Request) {
  try {
    const { childrenStory } = await request.json();

    if (!childrenStory?.trim()) {
      return NextResponse.json(
        { error: "Missing story text" },
        { status: 400 }
      );
    }

    const client = getClaudeClient();

    // Tiny task: thinking off (it would eat the 200-token budget) and low effort
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 200,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate ambient for this story:\n\n${childrenStory.slice(0, 500)}`,
        },
      ],
    });

    let result = "";
    for (const block of response.content) {
      if (block.type === "text") result += block.text;
    }

    const ambientMatch = result.match(/אווירה:\s*(.+)/);
    if (!ambientMatch) {
      console.warn(
        `Sound design: no ambient line (stop_reason: ${response.stop_reason}), using default. Output:`,
        result,
      );
    }
    const ambient = ambientMatch?.[1]?.trim() || "soft piano lullaby with gentle night sounds";

    return NextResponse.json({ ambient, effects: "" });
  } catch (error) {
    console.error("Sound design generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sound design" },
      { status: 500 }
    );
  }
}
