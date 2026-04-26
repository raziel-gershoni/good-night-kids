import Link from "next/link";
import { ParashaWizard } from "@/components/parasha-wizard";

export default function ParashaPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gold-400 underline"
          >
            ← סיפור מטקסט חופשי
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-gold-400 mb-2">פרשת השבוע</h1>
        <p className="text-gray-400 text-sm">
          סיפור שינה לילדים שמסביר רעיון מתוך פרשת השבוע — לא מספר אותה מחדש.
        </p>
      </div>
      <ParashaWizard />
    </main>
  );
}
