import { findParashaByEnglishName, type Parasha } from "./list";

const SEFARIA_BASE = "https://www.sefaria.org/api";

interface CalendarResponse {
  calendar_items?: Array<{
    title?: { en?: string; he?: string };
    displayValue?: { en?: string; he?: string };
    url?: string;
    ref?: string;
  }>;
}

interface TextsResponse {
  he?: string | string[] | string[][];
  ref?: string;
}

function refToUrlPath(ref: string): string {
  return ref.replace(/\s+/g, "_");
}

function flattenHebrewVerses(he: TextsResponse["he"]): { ref: string; text: string }[] {
  if (!he) return [];
  if (typeof he === "string") return [{ ref: "1", text: stripHtml(he) }];
  const flat: { ref: string; text: string }[] = [];
  if (Array.isArray(he) && he.length && Array.isArray(he[0])) {
    const chapters = he as string[][];
    chapters.forEach((chapter, ci) => {
      chapter.forEach((verse, vi) => {
        flat.push({ ref: `${ci + 1}:${vi + 1}`, text: stripHtml(verse) });
      });
    });
  } else {
    (he as string[]).forEach((verse, i) => {
      flat.push({ ref: `${i + 1}`, text: stripHtml(verse) });
    });
  }
  return flat;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function getCurrentParasha(): Promise<Parasha | null> {
  const res = await fetch(`${SEFARIA_BASE}/calendars`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sefaria calendar fetch failed: ${res.status}`);
  const data = (await res.json()) as CalendarResponse;
  const item = data.calendar_items?.find(
    (c) => c.title?.en === "Parashat Hashavua",
  );
  const englishName = item?.displayValue?.en || item?.url;
  if (!englishName) return null;
  return findParashaByEnglishName(englishName) ?? null;
}

export async function fetchParashaText(parasha: Parasha): Promise<{
  fullHebrewText: string;
  verses: { ref: string; text: string }[];
}> {
  const url = `${SEFARIA_BASE}/texts/${refToUrlPath(parasha.sefariaRef)}?context=0&commentary=0&pad=0`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sefaria text fetch failed: ${res.status}`);
  const data = (await res.json()) as TextsResponse;
  const verses = flattenHebrewVerses(data.he).map((v) => ({
    ref: `${parasha.englishName} ${v.ref}`,
    text: v.text,
  }));
  const fullHebrewText = verses.map((v) => v.text).join(" ");
  return { fullHebrewText, verses };
}
