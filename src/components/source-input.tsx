"use client";

import { SOURCE_TYPES, type SourceType } from "@/lib/types";

interface SourceInputProps {
  originalText: string;
  sourceType: SourceType;
  onTextChange: (text: string) => void;
  onSourceTypeChange: (type: SourceType) => void;
}

export function SourceInput({
  originalText,
  sourceType,
  onTextChange,
  onSourceTypeChange,
}: SourceInputProps) {
  return (
    <section className="space-y-3">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <h2 className="font-display text-xl sm:text-2xl font-medium text-ink">
          טקסט מקור
        </h2>
        <div
          role="group"
          className="inline-flex rounded-md border border-rule bg-paper overflow-hidden self-start sm:self-auto"
        >
          {SOURCE_TYPES.map((st) => {
            const active = sourceType === st.value;
            return (
              <button
                key={st.value}
                onClick={() => onSourceTypeChange(st.value)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors ${
                  active
                    ? "bg-brass text-canvas font-medium"
                    : "text-ink-muted hover:text-ink hover:bg-paper-2"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </header>

      <textarea
        value={originalText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="הדבק כאן טקסט מהמקור…"
        rows={6}
        className="w-full bg-paper border border-rule rounded-md p-4 text-ink placeholder:text-ink-subtle resize-y focus:outline-none focus:border-brass transition-colors leading-relaxed"
      />

      <div className="text-xs text-ink-subtle text-left tabular-nums" dir="ltr">
        {originalText.length} תווים
      </div>
    </section>
  );
}
