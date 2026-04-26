import { StoryWizard } from "@/components/story-wizard";
import { PageHero } from "@/components/site-chrome";

export default function Home() {
  return (
    <main className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <PageHero
        eyebrow="מטקסט חופשי"
        title="סיפור שינה מהמסורת"
        description="הדביקו טקסט מהתנ״ך, הגמרא או המדרש, וקבלו סיפור שינה לילדים — בעברית, עם הקראה."
      />
      <StoryWizard />
    </main>
  );
}
