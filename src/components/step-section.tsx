"use client";

interface StepSectionProps {
  stepNumber: number;
  title: string;
  buttonLabel: string;
  isLoading: boolean;
  isDisabled: boolean;
  onGenerate: () => void;
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}

export function StepSection({
  stepNumber,
  title,
  buttonLabel,
  isLoading,
  isDisabled,
  onGenerate,
  value,
  onChange,
  children,
}: StepSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gold-400">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-night-900 text-sm font-bold ml-2">
            {stepNumber}
          </span>
          {title}
        </h2>
        <button
          onClick={onGenerate}
          disabled={isDisabled || isLoading}
          className="px-5 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-night-600 disabled:text-gray-500 text-night-900 font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {isLoading ? "מעבד..." : buttonLabel}
        </button>
      </div>

      {value && (
        <>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className="w-full bg-night-800 border border-night-600/50 rounded-xl p-4 text-white resize-y focus:outline-none focus:border-gold-400 leading-relaxed"
          />
          <div className="text-xs text-gray-500 text-left">
            {value.trim().split(/\s+/).filter(Boolean).length} מילים | {value.length} תווים
          </div>
        </>
      )}

      {children}
    </div>
  );
}
