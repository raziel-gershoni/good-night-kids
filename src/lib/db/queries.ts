import { db } from "./index";
import { stories, type NewStory } from "./schema";
import { eq, desc, sql, isNotNull } from "drizzle-orm";
import { generateSlug } from "../utils";

export async function createStory(data: {
  sourceType: string;
  originalText: string;
  childrenStory?: string;
  ttsScript?: string;
  audioData?: Buffer;
  audioMimeType?: string;
  model: string;
  thinkingLevel?: string;
  title?: string;
}): Promise<{ id: string; slug: string }> {
  const slug = generateSlug();
  const title =
    data.title || data.childrenStory?.split("\n")[0]?.trim() || "סיפור חדש";

  const [result] = await db
    .insert(stories)
    .values({
      slug,
      title,
      sourceType: data.sourceType as NewStory["sourceType"],
      originalText: data.originalText,
      childrenStory: data.childrenStory || null,
      ttsScript: data.ttsScript || null,
      audioData: data.audioData || null,
      audioMimeType: data.audioMimeType || null,
      model: data.model,
      thinkingLevel: data.thinkingLevel || null,
    })
    .returning({ id: stories.id, slug: stories.slug });

  return result;
}

export async function updateStory(
  id: string,
  data: {
    sourceType?: string;
    originalText?: string;
    childrenStory?: string;
    ttsScript?: string;
    audioData?: Buffer;
    audioMimeType?: string;
    model?: string;
    thinkingLevel?: string;
    title?: string;
  }
): Promise<{ id: string; slug: string }> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.sourceType !== undefined)
    updateData.sourceType = data.sourceType;
  if (data.originalText !== undefined)
    updateData.originalText = data.originalText;
  if (data.childrenStory !== undefined)
    updateData.childrenStory = data.childrenStory;
  if (data.ttsScript !== undefined) updateData.ttsScript = data.ttsScript;
  if (data.audioData !== undefined) updateData.audioData = data.audioData;
  if (data.audioMimeType !== undefined)
    updateData.audioMimeType = data.audioMimeType;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.thinkingLevel !== undefined)
    updateData.thinkingLevel = data.thinkingLevel;
  if (data.title !== undefined) updateData.title = data.title;

  const [result] = await db
    .update(stories)
    .set(updateData)
    .where(eq(stories.id, id))
    .returning({ id: stories.id, slug: stories.slug });

  return result;
}

export async function listStories() {
  return db
    .select({
      id: stories.id,
      slug: stories.slug,
      title: stories.title,
      sourceType: stories.sourceType,
      originalText: stories.originalText,
      childrenStory: stories.childrenStory,
      ttsScript: stories.ttsScript,
      hasAudio: sql<boolean>`${stories.audioData} is not null`.as("has_audio"),
      model: stories.model,
      thinkingLevel: stories.thinkingLevel,
      createdAt: stories.createdAt,
    })
    .from(stories)
    .orderBy(desc(stories.createdAt));
}

export async function getStoryById(id: string) {
  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  return story;
}

export async function getStoryBySlug(slug: string) {
  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.slug, slug))
    .limit(1);
  return story;
}

export async function getStoryAudio(id: string) {
  const [story] = await db
    .select({
      audioData: stories.audioData,
      audioMimeType: stories.audioMimeType,
    })
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  return story;
}

export async function deleteStory(id: string) {
  await db.delete(stories).where(eq(stories.id, id));
}
