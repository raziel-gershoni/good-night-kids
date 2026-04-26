"use client";

import { useEffect, useState } from "react";
import { PARASHIOT, type Parasha } from "@/lib/parasha/list";

interface ParashaPickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const BOOK_LABELS: Record<Parasha["book"], string> = {
  Genesis: "בראשית",
  Exodus: "שמות",
  Leviticus: "ויקרא",
  Numbers: "במדבר",
  Deuteronomy: "דברים",
};

export function ParashaPicker({ selectedId, onSelect }: ParashaPickerProps) {
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/parasha/calendar");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        const id = data?.parasha?.id as string | undefined;
        if (id) {
          setCurrentWeekId(id);
          if (!selectedId) onSelect(id);
        }
      } catch (e) {
        if (!cancelled) setCalendarError((e as Error).message);
      } finally {
        if (!cancelled) setIsLoadingCurrent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = PARASHIOT.reduce<Record<Parasha["book"], Parasha[]>>(
    (acc, p) => {
      (acc[p.book] ||= []).push(p);
      return acc;
    },
    {} as Record<Parasha["book"], Parasha[]>,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gold-400">בחר פרשה</label>
        {isLoadingCurrent ? (
          <span className="text-xs text-gray-500">טוען פרשת השבוע...</span>
        ) : currentWeekId ? (
          <button
            type="button"
            onClick={() => onSelect(currentWeekId)}
            className="text-xs text-gold-400 hover:text-gold-300 underline"
          >
            דלג לפרשת השבוע
          </button>
        ) : calendarError ? (
          <span className="text-xs text-red-400" title={calendarError}>
            לא הצלחתי לקבוע את פרשת השבוע
          </span>
        ) : null}
      </div>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-night-800 border border-night-600/50 rounded-xl p-3 text-white focus:outline-none focus:border-gold-400"
      >
        <option value="" disabled>
          — בחר פרשה —
        </option>
        {(Object.keys(grouped) as Parasha["book"][]).map((book) => (
          <optgroup key={book} label={BOOK_LABELS[book]}>
            {grouped[book].map((p) => (
              <option key={p.id} value={p.id}>
                {p.hebrewName}
                {p.id === currentWeekId ? "  ★ פרשת השבוע" : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
