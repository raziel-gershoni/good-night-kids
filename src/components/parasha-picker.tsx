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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="parasha-select"
          className="text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium"
        >
          בחר פרשה
        </label>
        {isLoadingCurrent ? (
          <span className="text-xs text-ink-subtle">טוען פרשת השבוע…</span>
        ) : currentWeekId ? (
          <button
            type="button"
            onClick={() => onSelect(currentWeekId)}
            className="text-xs text-brass hover:text-brass-soft inline-flex items-center gap-1 transition-colors"
          >
            <StarIcon className="w-3 h-3" />
            פרשת השבוע
          </button>
        ) : calendarError ? (
          <span className="text-xs text-clay" title={calendarError}>
            לא הצלחתי לקבוע
          </span>
        ) : null}
      </div>
      <div className="relative">
        <select
          id="parasha-select"
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-paper border border-rule rounded-md py-3 pe-10 ps-4 text-ink font-display text-lg focus:outline-none focus:border-brass transition-colors appearance-none"
        >
          <option value="" disabled>
            — בחר פרשה —
          </option>
          {(Object.keys(grouped) as Parasha["book"][]).map((book) => (
            <optgroup key={book} label={BOOK_LABELS[book]}>
              {grouped[book].map((p) => (
                <option key={p.id} value={p.id}>
                  {p.hebrewName}
                  {p.id === currentWeekId ? " ★" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <CaretIcon className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
      </div>
    </div>
  );
}

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 1l1.9 4.6 5 .4-3.8 3.3 1.2 4.9L8 11.7 3.7 14.2 4.9 9.3 1.1 6l5-.4z" />
    </svg>
  );
}

function CaretIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
