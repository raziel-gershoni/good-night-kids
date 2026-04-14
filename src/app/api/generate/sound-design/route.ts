import { NextResponse } from "next/server";
import { getClaudeClient } from "@/lib/claude/client";

export const maxDuration = 300;

const SOUND_DESIGN_PROMPT = `You are a sound designer for a children's bedtime story audio production. Given a Hebrew story, generate:

1. An ambient background description (SHORT, max 8 words in English, for a sound effects model)
2. A list of 5-8 sound effects placed at specific moments in the story

CRITICAL RULES:
- The ambient description must be in English, short and simple. E.g.: "soft piano lullaby with crickets at night"
- Each effect has a Hebrew quote (2-4 words copied EXACTLY from the story) and an English sound description
- The Hebrew quote MUST be copied CHARACTER-FOR-CHARACTER from the story text. Do not paraphrase. Do not use biblical Hebrew. Copy-paste consecutive words exactly as they appear.
- Only physical sounds recordable with a microphone: "sheep bleating", "door creaking", "footsteps on gravel", "bird singing", "fire crackling", "river flowing"
- NO abstract sounds: not "sound of realization", not "magical feeling"
- Spread effects evenly throughout the story from beginning to end

Output format (follow exactly):

אווירה: [short English ambient description]

אפקטים:
* [exact quote from story] - [English sound description]
* [exact quote from story] - [English sound description]
* [exact quote from story] - [English sound description]
* [exact quote from story] - [English sound description]
* [exact quote from story] - [English sound description]`;

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

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SOUND_DESIGN_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the story. Generate sound design for it:\n\n${childrenStory}`,
        },
      ],
    });

    let soundDesign = "";
    for (const block of response.content) {
      if (block.type === "text") {
        soundDesign += block.text;
      }
    }

    // Parse into ambient + effects
    const ambientMatch = soundDesign.match(/אווירה:\s*(.+)/);
    const ambient = ambientMatch?.[1]?.trim() || "";

    const effectLines: string[] = [];
    const regex = /\*\s*(.+)/g;
    let match;
    while ((match = regex.exec(soundDesign)) !== null) {
      effectLines.push(match[1].trim());
    }

    return NextResponse.json({
      ambient,
      effects: effectLines.join("\n"),
      raw: soundDesign,
    });
  } catch (error) {
    console.error("Sound design generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sound design" },
      { status: 500 }
    );
  }
}
