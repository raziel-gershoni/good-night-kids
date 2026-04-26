"use client";

import type { SanityReport } from "@/lib/llm/schemas";

interface SanityReportCardProps {
  report: SanityReport;
}

const STATUS_META: Record<
  SanityReport["status"],
  { label: string; tone: "leaf" | "amber" | "clay"; icon: React.ReactNode }
> = {
  ok: { label: "תקין", tone: "leaf", icon: <CheckIcon /> },
  minor: { label: "הערות מינוריות", tone: "amber", icon: <WarnIcon /> },
  major: { label: "בעיה משמעותית", tone: "clay", icon: <XIcon /> },
};

const TONE_CLASS = {
  leaf: {
    border: "border-leaf/40",
    badgeBg: "bg-leaf/10",
    badgeText: "text-leaf",
  },
  amber: {
    border: "border-amber/40",
    badgeBg: "bg-amber/10",
    badgeText: "text-amber",
  },
  clay: {
    border: "border-clay/40",
    badgeBg: "bg-clay/10",
    badgeText: "text-clay",
  },
};

export function SanityReportCard({ report }: SanityReportCardProps) {
  const meta = STATUS_META[report.status];
  const tone = TONE_CLASS[meta.tone];

  return (
    <div
      className={`rounded-lg border ${tone.border} bg-paper p-5 space-y-4 paper-fade`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center ${tone.badgeBg} ${tone.badgeText}`}
          aria-hidden
        >
          {meta.icon}
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium">
            סטטוס
          </div>
          <div className={`font-display text-lg ${tone.badgeText}`}>
            {meta.label}
          </div>
        </div>
      </div>

      {report.issues.length > 0 && (
        <ReportSection title="בעיות שזוהו" items={report.issues} />
      )}

      {report.suggestions.length > 0 && (
        <ReportSection title="הצעות לשיפור" items={report.suggestions} />
      )}

      {report.issues.length === 0 && report.suggestions.length === 0 && (
        <div className="text-sm text-ink-subtle">אין הערות נוספות.</div>
      )}
    </div>
  );
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink leading-relaxed">
            <span
              className="text-brass-soft pt-1.5 flex-shrink-0"
              aria-hidden
            >
              •
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l10 18H2z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="12" y1="17.5" x2="12" y2="17.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
