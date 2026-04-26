interface OrnamentProps {
  className?: string;
}

export function Ornament({ className = "" }: OrnamentProps) {
  return (
    <div className={`ornament-divider ${className}`} aria-hidden>
      <svg width="18" height="6" viewBox="0 0 18 6" fill="currentColor">
        <polygon points="2,3 4,1 6,3 4,5" />
        <polygon points="7,3 9,0 11,3 9,6" />
        <polygon points="12,3 14,1 16,3 14,5" />
      </svg>
    </div>
  );
}

export function OrnamentInline({ className = "" }: OrnamentProps) {
  return (
    <svg
      width="18"
      height="6"
      viewBox="0 0 18 6"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <polygon points="2,3 4,1 6,3 4,5" />
      <polygon points="7,3 9,0 11,3 9,6" />
      <polygon points="12,3 14,1 16,3 14,5" />
    </svg>
  );
}
