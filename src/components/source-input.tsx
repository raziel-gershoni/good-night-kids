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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gold-400">טקסט מקורי</h2>
        <div className="flex gap-2">
          {SOURCE_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => onSourceTypeChange(st.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sourceType === st.value
                  ? "bg-gold-500 text-night-900 font-bold"
                  : "bg-night-700 text-gray-300 hover:bg-night-600"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={originalText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="הדבק כאן טקסט מהמקור..."
        rows={6}
        className="w-full bg-night-800 border border-night-600/50 rounded-xl p-4 text-white placeholder-gray-500 resize-y focus:outline-none focus:border-gold-400 leading-relaxed"
      />
      <div className="text-xs text-gray-500 text-left">
        {originalText.length} תווים
      </div>
    </div>
  );
}
