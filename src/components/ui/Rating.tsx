import { Star } from 'lucide-react';

export function Rating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="fill-warning-400 text-warning-400" style={{ width: size, height: size }} />
      <span className="font-semibold text-neutral-800 dark:text-neutral-100">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-neutral-400">({count})</span>}
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 active:scale-95"
          aria-label={`${n} estrelas`}
        >
          <Star
            className={`h-7 w-7 ${n <= value ? 'fill-warning-400 text-warning-400' : 'fill-neutral-200 text-neutral-300 dark:fill-neutral-700 dark:text-neutral-600'}`}
          />
        </button>
      ))}
    </div>
  );
}
