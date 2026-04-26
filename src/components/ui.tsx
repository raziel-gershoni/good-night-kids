"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: "sm" | "md";
  iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brass text-canvas hover:bg-brass-soft disabled:bg-rule-strong disabled:text-ink-subtle",
  secondary:
    "border border-rule-strong bg-paper text-ink hover:border-brass hover:text-brass disabled:opacity-50 disabled:hover:border-rule-strong disabled:hover:text-ink",
  ghost:
    "text-ink-muted hover:text-ink hover:bg-paper-2 disabled:opacity-50 disabled:hover:bg-transparent",
  danger:
    "border border-rule-strong text-ink-muted hover:text-clay hover:border-clay disabled:opacity-50",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading = false,
    size = "md",
    iconOnly = false,
    className = "",
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const padding = iconOnly ? "p-2" : SIZE_CLASSES[size];
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${padding} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

interface SectionProps {
  step: number;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
  description?: string;
}

export function Section({ step, title, action, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="step-num">{step}</span>
          <div className="flex flex-col min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-medium text-ink leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-ink-subtle mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="shrink-0 ps-11 sm:ps-0 self-start sm:self-auto">
            {action}
          </div>
        )}
      </header>
      {children && <div className="paper-fade">{children}</div>}
    </section>
  );
}

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </label>
      )}
      {children}
      {hint && <div className="text-xs text-ink-subtle">{hint}</div>}
    </div>
  );
}
