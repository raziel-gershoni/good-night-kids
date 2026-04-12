import { getClaudeClient } from "./client";
import type Anthropic from "@anthropic-ai/sdk";
import type { ClaudeModel, EffortLevel, SourceType } from "../types";

const SOURCE_LABELS: Record<string, string> = {
  tanakh: 'תנ"ך',
  gmara: "גמרא",
  zohar: "זוהר",
  midrash: "מדרש",
  other: "טקסט מסורתי",
};

const SYSTEM_PROMPT = `You are an expert children's bedtime storyteller specializing in adapting Jewish traditional texts into bedtime stories for young children.

OUTPUT RULES:
- Output ONLY in Hebrew. No English commentary, no wrapping, no explanations.
- Do NOT add nikud (vowel marks) to the Hebrew text - a separate system handles vocalization.
- Use nikud from the INPUT text to understand correct pronunciation, but output without nikud.
- The output will be sent directly to ElevenLabs v3 TTS which understands audio tags.

STORY RULES:
1. Be faithful to the source text's meaning - preserve the core message and moral lesson
2. Keep important details: names, places, key events, unique details. Do not omit plot-relevant content.
3. Use simple, age-appropriate language for children aged 4-8
4. Create a warm, soothing bedtime-story tone
5. Expand the story with descriptions, dialogues, and emotions. Do not shorten.
6. Start with a classic opening like "פעם, לפני הרבה הרבה שנים..."
7. End with a positive, calming conclusion
8. No scary, violent, or overly complex content
9. Handle raw copy-paste formatting: ignore verse numbers, chapter markers, taamei hamikra, Daf/Amud references, footnotes, and other artifacts. Use nikud from input to understand the text correctly.

AUDIO TAGS (ElevenLabs v3):
Embed these inline throughout the story to control voice delivery and add sound effects.
The TTS model will interpret them as instructions - they will NOT be spoken aloud.

Emotion/delivery tags (use frequently):
[soft], [excited], [whispers], [cheerfully], [calm], [awe], [dramatic tone], [playfully], [warmly], [gently]

Pacing tags:
[pause], [slowly], [long pause]

Sound effect tags (use where natural in the story):
[footsteps], [door creak], [wind blowing], [bird singing], [thunder], [rain], [fire crackling],
[horse galloping], [river flowing], [sheep bleating], [crowd murmuring], [trumpet sound]

Character voice tags (for dialogue):
[deep voice], [high pitched], [old voice], [young voice], [booming voice]

Example usage:
[soft] פעם, לפני הרבה הרבה שנים, [pause] חי לו רועה צעיר בשם דוד. [sheep bleating]
[excited] יום אחד, כשדוד שמר על הצאן, הגיע שליח מהמלך!
[deep voice] "דוד! המלך קורא לך!" [pause]
[warmly] דוד חייך ויצא לדרך. [footsteps]

IMPORTANT: Use 10-15 audio tags spread throughout the story. Mix emotion tags with sound effects for a rich experience.

SOUND DESIGN SECTION:
After the story, add this section for background ambient sound:

### עיצוב סאונד

אווירה: [English description for ambient background. Must end with "instrumental only, absolutely no vocals, no singing, no humming, seamless loop". E.g.: "Gentle bedtime lullaby with soft piano, nighttime countryside sounds, soft breeze, calm atmosphere, instrumental only, absolutely no vocals, no singing, no humming, seamless loop"]`;

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
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `המקור הוא ${sourceLabel}.\n\nעבד את הטקסט הבא לסיפור שינה לילדים:\n\n${params.originalText}`,
      },
    ],
  } as unknown as Anthropic.MessageCreateParamsNonStreaming);

  // Extract text blocks only (skip thinking blocks)
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  return textBlocks.map((b) => b.text).join("\n") || "";
}
