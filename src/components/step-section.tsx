"use client";

import { Button } from "./ui";

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
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="step-num">{stepNumber}</span>
          <h2 className="font-display text-2xl font-medium text-ink leading-tight">
            {title}
          </h2>
        </div>
        <Button onClick={onGenerate} loading={isLoading} disabled={isDisabled}>
          {isLoading ? "מעבד…" : buttonLabel}
        </Button>
      </header>

      {value && (
        <div className="space-y-1.5 paper-fade">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={9}
            className="w-full bg-paper border border-rule rounded-md p-4 text-ink leading-relaxed resize-y focus:outline-none focus:border-brass transition-colors"
          />
          <div className="text-xs text-ink-subtle text-left tabular-nums" dir="ltr">
            {wordCount} מילים · {value.length} תווים
          </div>
        </div>
      )}

      {children}
    </section>
  );
}
