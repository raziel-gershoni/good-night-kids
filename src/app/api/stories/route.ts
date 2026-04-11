import { NextResponse } from "next/server";
import { createStory, listStories } from "@/lib/db/queries";

export async function GET() {
  try {
    const allStories = await listStories();
    const stories = allStories.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    }));
    return NextResponse.json({ stories });
  } catch (error) {
    console.error("List stories error:", error);
    return NextResponse.json(
      { error: "Failed to list stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let audioData: Buffer | undefined;
    if (body.audioBase64) {
      audioData = Buffer.from(body.audioBase64, "base64");
    }

    const result = await createStory({
      sourceType: body.sourceType || "other",
      originalText: body.originalText,
      childrenStory: body.childrenStory,
      ttsScript: body.ttsScript,
      audioData,
      audioMimeType: audioData ? "audio/wav" : undefined,
      model: body.model || "gemini-3.1-flash-lite-preview",
      thinkingLevel: body.thinkingLevel,
      title: body.title,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Create story error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
