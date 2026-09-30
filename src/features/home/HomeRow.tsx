import React, { useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** Cards per row on desktop: the grid's column count, and how many show before "Xem thêm". */
const DESKTOP_COLUMNS = 5;

interface HomeRowProps<T> {
  title: string;
  icon: string;
  hint?: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}

/**
 * A home section: a horizontal swipe row on phones and tablets, a 5-column grid on desktop that
 * shows one row until "Xem thêm". One list for both, so every card is rendered once.
 */
export function HomeRow<T>({ title, icon, hint, items, getKey, renderItem }: HomeRowProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const more = items.length > DESKTOP_COLUMNS;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5 sm:gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="font-serif text-lg sm:text-xl font-bold text-text flex items-center gap-2">
            <span aria-hidden="true">{icon}</span>
            <span className="truncate">{title}</span>
            <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted tabular-nums">
              {items.length}
            </span>
          </h2>
          {hint && <p className="text-xs text-text-muted italic mt-0.5">{hint}</p>}
        </div>
        {more && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="hidden lg:inline-flex shrink-0 items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-primary-ink bg-primary-tint hover:bg-primary-soft/40 transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                Thu gọn <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Xem thêm {items.length - DESKTOP_COLUMNS} <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        )}
      </div>

      <ul className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-3 -mx-3 px-3 sm:-mx-6 sm:px-6 sm:scroll-px-6 pt-1 pb-3 lg:grid lg:grid-cols-5 lg:gap-4.5 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-1">
        {items.map((item, i) => (
          <li
            key={getKey(item)}
            className={`snap-start shrink-0 w-[44%] sm:w-[30%] md:w-[23%] lg:w-auto flex ${!expanded && i >= DESKTOP_COLUMNS ? 'lg:hidden' : ''}`}
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}
