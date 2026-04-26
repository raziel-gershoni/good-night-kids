"use client";

import type { SanityReport } from "@/lib/llm/schemas";

interface SanityReportCardProps {
  report: SanityReport;
}

const STATUS_META: Record<
  SanityReport["status"],
  { label: string; icon: string; bg: string; border: string; text: string }
> = {
  ok: {
    label: "תקין",
    icon: "✅",
    bg: "bg-green-900/20",
    border: "border-green-500/40",
    text: "text-green-300",
  },
  minor: {
    label: "הערות מינוריות",
    icon: "⚠️",
    bg: "bg-yellow-900/20",
    border: "border-yellow-500/40",
    text: "text-yellow-300",
  },
  major: {
    label: "בעיה משמעותית",
    icon: "❌",
    bg: "bg-red-900/20",
    border: "border-red-500/40",
    text: "text-red-300",
  },
};

export function SanityReportCard({ report }: SanityReportCardProps) {
  const meta = STATUS_META[report.status];
  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4 space-y-3`}>
      <div className={`flex items-center gap-2 font-bold ${meta.text}`}>
        <span aria-hidden>{meta.icon}</span>
        <span>{meta.label}</span>
      </div>

      {report.issues.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-gray-300">בעיות</h4>
          <ul className="list-disc pr-5 space-y-1 text-sm text-gray-200">
            {report.issues.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      )}

      {report.suggestions.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-gray-300">הצעות לשיפור</h4>
          <ul className="list-disc pr-5 space-y-1 text-sm text-gray-200">
            {report.suggestions.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      )}

      {report.issues.length === 0 && report.suggestions.length === 0 && (
        <div className="text-sm text-gray-400">אין הערות נוספות.</div>
      )}
    </div>
  );
}
