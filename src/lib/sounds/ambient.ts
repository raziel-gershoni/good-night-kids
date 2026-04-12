/**
 * Generate ambient sound loop using ElevenLabs Sound Effects API.
 * Uses loop: true for seamless looping.
 */
export async function generateAmbientSound(
  prompt: string
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY not set");
    return null;
  }

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/sound-generation",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: 20,
          loop: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `ElevenLabs ambient error: ${response.status} - ${errorText}`
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Ambient generation error:", err);
    return null;
  }
}

/**
 * Parse the ambient prompt from the sound design section of the story.
 */
export function parseAmbientPrompt(storyText: string): string | null {
  const marker = "### עיצוב סאונד";
  const idx = storyText.indexOf(marker);
  if (idx === -1) return null;

  const section = storyText.slice(idx + marker.length);
  const match = section.match(/אווירה:\s*(.+)/);
  return (
    match?.[1]?.trim() ||
    "Peaceful nighttime sounds with gentle lullaby, soft piano, calm atmosphere, instrumental only, no vocals, seamless loop"
  );
}
