import { ParashaWizard } from "@/components/parasha-wizard";
import { PageHero } from "@/components/site-chrome";

export default function ParashaPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <PageHero
        eyebrow="פרשת השבוע"
        title="סיפור שמסביר רעיון"
        description="לא סיפור-מחדש של הפרשה — אלא סיפור מקורי לילדים שמדגים רעיון אחד שעולה ממנה, עם גשר אחד מפורש לפסוקי המקור."
      />
      <ParashaWizard />
    </main>
  );
}
