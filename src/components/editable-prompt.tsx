"use client";

import { useEffect, useState } from "react";

interface EditablePromptProps {
  storageKey: string;
  defaultPrompt: string;
  value: string;
  onChange: (next: string) => void;
}

export function EditablePrompt({
  storageKey,
  defaultPrompt,
  value,
  onChange,
}: EditablePromptProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) onChange(stored);
      else onChange(defaultPrompt);
    } catch {
      onChange(defaultPrompt);
    }
    // mount-only sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next: string) => {
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      /* ignore */
    }
  };

  const handleReset = () => {
    onChange(defaultPrompt);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  const isCustom = hasMounted && value !== defaultPrompt;

  return (
    <details className="group rounded-md border border-rule bg-paper-2/50 open:bg-paper">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm text-ink-muted hover:text-ink flex items-center justify-between list-none">
        <span className="flex items-center gap-2">
          <PencilIcon className="w-3.5 h-3.5" />
          ערוך פרומפט
          {isCustom && (
            <span className="text-[10px] uppercase tracking-wider text-brass border border-brass/40 px-1.5 py-0.5 rounded">
              שונה
            </span>
          )}
        </span>
        <CaretIcon className="text-ink-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-rule">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => persist(e.target.value)}
          rows={10}
          dir="rtl"
          className="w-full bg-canvas border border-rule rounded p-3 text-ink text-sm leading-relaxed resize-y focus:outline-none focus:border-brass transition-colors font-mono"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-subtle tabular-nums" dir="ltr">
            {value.length} תווים · נשמר בדפדפן
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isCustom}
            className="text-ink-muted hover:text-brass disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors"
          >
            <ResetIcon className="w-3 h-3" />
            אפס לברירת מחדל
          </button>
        </div>
      </div>
    </details>
  );
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 4l4 4-12 12H4v-4z"
      />
    </svg>
  );
}

function ResetIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12a9 9 0 1015 6.7M3 12V5m0 7h7"
      />
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
