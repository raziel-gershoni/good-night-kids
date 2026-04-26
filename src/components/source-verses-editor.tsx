"use client";

interface Verse {
  ref: string;
  text: string;
}

interface SourceVersesEditorProps {
  verses: Verse[];
  onChange: (next: Verse[]) => void;
}

export function SourceVersesEditor({
  verses,
  onChange,
}: SourceVersesEditorProps) {
  const update = (index: number, field: keyof Verse, value: string) => {
    const next = verses.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(verses.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...verses, { ref: "", text: "" }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-[0.22em] text-ink-subtle font-medium">
          פסוקי מקור
        </h3>
        <span className="text-xs text-ink-subtle tabular-nums" dir="ltr">
          {verses.length}
        </span>
      </div>
      <div className="space-y-2">
        {verses.map((v, i) => (
          <div
            key={i}
            className="rounded-md border border-rule bg-paper-2/50 p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={v.ref}
                onChange={(e) => update(i, "ref", e.target.value)}
                placeholder="הפניה (Bereshit 1:1)"
                className="flex-1 bg-paper border border-rule rounded px-2.5 py-1 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brass transition-colors"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-ink-subtle hover:text-clay px-2 py-1 transition-colors"
                aria-label={`מחק פסוק ${i + 1}`}
              >
                הסר
              </button>
            </div>
            <textarea
              value={v.text}
              onChange={(e) => update(i, "text", e.target.value)}
              rows={2}
              placeholder="טקסט הפסוק בעברית"
              className="w-full bg-paper border border-rule rounded px-2.5 py-1.5 text-sm text-ink leading-relaxed resize-y focus:outline-none focus:border-brass transition-colors"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-sm text-brass hover:text-brass-soft inline-flex items-center gap-1 transition-colors"
      >
        <span aria-hidden>+</span> הוסף פסוק
      </button>
    </div>
  );
}
