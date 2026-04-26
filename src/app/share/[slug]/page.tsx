export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStoryBySlug } from "@/lib/db/queries";
import { OrnamentInline } from "@/components/ornament";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SOURCE_LABELS: Record<string, string> = {
  tanakh: 'תנ"ך',
  gmara: "גמרא",
  zohar: "זוהר",
  midrash: "מדרש",
  other: "מקור יהודי",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "סיפור לא נמצא" };
  return {
    title: `${story.title || "סיפור שינה"} | לילה טוב ילדים`,
    description:
      story.childrenStory?.slice(0, 150) || "סיפור שינה מהמסורת היהודית",
  };
}

export default async function SharePage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  return (
    <main className="container mx-auto max-w-2xl px-6 py-12">
      <article className="space-y-8">
        <header className="text-center space-y-3 paper-fade">
          <div className="text-[10px] uppercase tracking-[0.3em] text-brass">
            {SOURCE_LABELS[story.sourceType] || story.sourceType}
          </div>
          <h1 className="font-display text-4xl font-light text-ink leading-tight">
            {story.title || "סיפור שינה"}
          </h1>
          <div className="pt-1 flex justify-center">
            <OrnamentInline className="text-brass-soft opacity-70" />
          </div>
        </header>

        {story.audioData && (
          <div className="bg-paper border border-rule rounded-lg p-4">
            <audio
              controls
              className="w-full"
              src={`/api/stories/${story.id}/audio`}
            />
          </div>
        )}

        {story.childrenStory && (
          <div className="bg-paper border border-rule rounded-lg p-8 text-ink leading-loose font-display text-lg whitespace-pre-wrap story-body">
            {story.childrenStory}
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-sm text-brass hover:text-brass-soft underline-offset-4 hover:underline transition-colors"
          >
            צור סיפור משלך ←
          </Link>
        </div>
      </article>
    </main>
  );
}
