import { NextResponse } from "next/server";
import {
  getStoryById,
  updateStory,
  deleteStory,
} from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = await getStoryById(id);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...story,
      audioData: undefined,
      hasAudio: !!story.audioData,
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Get story error:", error);
    return NextResponse.json(
      { error: "Failed to get story" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let audioData: Buffer | undefined;
    if (body.audioBase64) {
      audioData = Buffer.from(body.audioBase64, "base64");
    }

    const result = await updateStory(id, {
      sourceType: body.sourceType,
      originalText: body.originalText,
      childrenStory: body.childrenStory,
      ttsScript: body.ttsScript,
      audioData,
      audioMimeType: audioData ? "audio/wav" : undefined,
      model: body.model,
      thinkingLevel: body.thinkingLevel,
      title: body.title,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update story error:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteStory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
