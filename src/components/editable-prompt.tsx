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
      if (stored !== null) {
        onChange(stored);
      } else {
        onChange(defaultPrompt);
      }
    } catch {
      onChange(defaultPrompt);
    }
    // Mount-only sync from localStorage.
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
    <details className="group rounded-xl border border-night-600/50 bg-night-800/40">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm text-gray-300 hover:text-gold-400 flex items-center justify-between">
        <span>
          ✏️ ערוך פרומפט {isCustom && <span className="text-gold-400">(שונה)</span>}
        </span>
        <span className="text-xs text-gray-500 group-open:hidden">פתח</span>
        <span className="text-xs text-gray-500 hidden group-open:inline">סגור</span>
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => persist(e.target.value)}
          rows={10}
          dir="rtl"
          className="w-full bg-night-900 border border-night-600/50 rounded-lg p-3 text-white text-sm font-mono resize-y focus:outline-none focus:border-gold-400 leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {value.length} תווים · נשמר אוטומטית בדפדפן
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isCustom}
            className="text-xs text-gray-400 hover:text-gold-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↺ אפס לברירת מחדל
          </button>
        </div>
      </div>
    </details>
  );
}
