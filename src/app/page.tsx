import { StoryWizard } from "@/components/story-wizard";

export default function Home() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gold-400 mb-2">
          לילה טוב ילדים
        </h1>
        <p className="text-gray-400 text-sm">
          סיפורי שינה מהמסורת היהודית, מופעלים בבינה מלאכותית
        </p>
      </div>
      <StoryWizard />
    </main>
  );
}
