import { getStoryAudio } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = await getStoryAudio(id);

    if (!story?.audioData) {
      return new Response("No audio found", { status: 404 });
    }

    const buffer =
      story.audioData instanceof Buffer
        ? story.audioData
        : Buffer.from(story.audioData);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": story.audioMimeType ?? "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Get audio error:", error);
    return new Response("Failed to get audio", { status: 500 });
  }
}
