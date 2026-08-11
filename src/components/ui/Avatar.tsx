export function Avatar({ src, alt, size = 40, ring, vipBadge }: { src: string; alt: string; size?: number; ring?: 'primary' | 'vip' | 'neutral'; vipBadge?: boolean }) {
  const ringClass =
    ring === 'vip'
      ? 'ring-2 ring-warning-400'
      : ring === 'primary'
        ? 'ring-2 ring-primary-400'
        : ring === 'neutral'
          ? 'ring-2 ring-neutral-200 dark:ring-neutral-700'
          : '';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        className={`rounded-full object-cover ${ringClass}`}
        style={{ width: size, height: size }}
      />
      {vipBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-warning-400 to-warning-600 ring-2 ring-white dark:ring-neutral-900">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-white"><path d="M5 16L3 8l5 4 4-8 4 8 5-4-2 8z"/></svg>
        </span>
      )}
    </div>
  );
}
