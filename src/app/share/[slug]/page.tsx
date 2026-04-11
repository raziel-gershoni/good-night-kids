export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getStoryBySlug } from "@/lib/db/queries";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) return { title: "סיפור לא נמצא" };

  return {
    title: `${story.title || "סיפור שינה"} | לילה טוב ילדים`,
    description:
      story.childrenStory?.slice(0, 150) ||
      "סיפור שינה מהמסורת היהודית",
  };
}

export default async function SharePage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) notFound();

  const sourceLabels: Record<string, string> = {
    tanakh: 'תנ"ך',
    gmara: "גמרא",
    zohar: "זוהר",
    midrash: "מדרש",
    other: "מקור יהודי",
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gold-400 mb-2">
          לילה טוב ילדים
        </h1>
        <p className="text-gray-400 text-sm">
          סיפורי שינה מהמסורת היהודית
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <span className="text-xs px-3 py-1 bg-night-700 rounded-full text-gray-400">
            מקור: {sourceLabels[story.sourceType] || story.sourceType}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white text-center">
          {story.title || "סיפור שינה"}
        </h2>

        {story.childrenStory && (
          <div className="bg-night-800/50 border border-night-600/30 rounded-xl p-6 leading-relaxed text-gray-200 whitespace-pre-wrap">
            {story.childrenStory}
          </div>
        )}

        {story.audioData && (
          <div className="bg-night-800/50 border border-night-600/30 rounded-xl p-4">
            <audio
              controls
              className="w-full"
              src={`/api/stories/${story.id}/audio`}
            />
          </div>
        )}

        <div className="text-center">
          <a
            href="/"
            className="text-gold-400 hover:text-gold-500 text-sm transition-colors"
          >
            צור סיפור משלך &larr;
          </a>
        </div>
      </div>
    </main>
  );
}
