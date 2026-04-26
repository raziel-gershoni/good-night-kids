"use client";

interface Verse {
  ref: string;
  text: string;
}

interface SourceVersesEditorProps {
  verses: Verse[];
  onChange: (next: Verse[]) => void;
}

export function SourceVersesEditor({ verses, onChange }: SourceVersesEditorProps) {
  const update = (index: number, field: keyof Verse, value: string) => {
    const next = verses.map((v, i) => (i === index ? { ...v, [field]: value } : v));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(verses.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...verses, { ref: "", text: "" }]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gold-400">פסוקי מקור</h3>
        <span className="text-xs text-gray-500">{verses.length} פסוקים</span>
      </div>
      <div className="space-y-2">
        {verses.map((v, i) => (
          <div
            key={i}
            className="rounded-xl border border-night-600/50 bg-night-800/40 p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={v.ref}
                onChange={(e) => update(i, "ref", e.target.value)}
                placeholder="הפניה (למשל: Bereshit 1:1)"
                className="flex-1 bg-night-900 border border-night-600/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-gold-400"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                aria-label={`מחק פסוק ${i + 1}`}
              >
                ✕ הסר
              </button>
            </div>
            <textarea
              value={v.text}
              onChange={(e) => update(i, "text", e.target.value)}
              rows={2}
              placeholder="טקסט הפסוק בעברית"
              className="w-full bg-night-900 border border-night-600/50 rounded-lg px-2 py-1 text-sm text-white resize-y focus:outline-none focus:border-gold-400"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-sm text-gold-400 hover:text-gold-300"
      >
        + הוסף פסוק
      </button>
    </div>
  );
}
