import React, { useEffect, useMemo, useRef } from 'react';
import { StatsPeriod } from '../../types';
import { Bloom } from './Bloom';
import { BLOOM_LEVELS, bloomLevel, dayLabel } from './format';

interface ReadingCalendarProps {
  days: { date: string; count: number }[];
  period: StatsPeriod;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const addDays = (k: string, n: number) => new Date(Date.parse(k) + n * DAY_MS).toISOString().slice(0, 10);
const weekday = (k: string) => (new Date(k).getUTCDay() + 6) % 7; // Monday = 0

type Cell = { date: string; count: number | null }; // null = not yet (future) / outside

const dayTitle = (c: Cell) =>
  c.count === null ? `${dayLabel(c.date)}: chưa tới` : `${dayLabel(c.date)}: ${c.count ? `${c.count} chương` : 'nghỉ ngơi'}`;

/**
 * Week / month: a wall calendar (big flowers, day numbers).
 * Year / all: a garden bed, one column per week, scrolls sideways on phones.
 */
export const ReadingCalendar: React.FC<ReadingCalendarProps> = ({ days, period }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const today = days[days.length - 1]?.date;
  const peak = useMemo(() => days.reduce((best, d) => (d.count > (best?.count ?? 0) ? d : best), undefined as (typeof days)[number] | undefined), [days]);

  const compact = period === 'week' || period === 'month';

  // pad to whole weeks (and to the end of the week / month for the wall calendar)
  const cells = useMemo<Cell[]>(() => {
    if (!days.length) return [];
    const first = days[0].date;
    let last = days[days.length - 1].date;
    if (period === 'week') last = addDays(first, 6);
    if (period === 'month') {
      const [y, m] = first.split('-').map(Number);
      last = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    }
    const byDate = new Map(days.map((d) => [d.date, d.count]));
    const out: Cell[] = [];
    for (let i = weekday(first); i > 0; i--) out.push({ date: addDays(first, -i), count: null });
    for (let k = first; k <= last; k = addDays(k, 1)) out.push({ date: k, count: byDate.get(k) ?? null });
    return out;
  }, [days, period]);

  // phones: start the garden bed at today (the right end)
  useEffect(() => {
    const el = scroller.current;
    if (el && !compact) el.scrollLeft = el.scrollWidth;
  }, [cells, compact]);

  if (!days.length) return null;

  if (compact) {
    return (
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="min-w-[320px] grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-center text-[11px] font-semibold text-text-muted">
              {w}
            </span>
          ))}
          {cells.map((c, i) => {
            const outside = c.count === null;
            const level = bloomLevel(c.count ?? 0);
            return (
              <div
                key={c.date + i}
                title={dayTitle(c)}
                className={`relative aspect-square max-h-16 rounded-xl flex items-center justify-center border ${
                  outside
                    ? 'border-dashed border-border/70 bg-transparent'
                    : c.date === today
                      ? 'border-primary bg-primary-tint/60'
                      : 'border-border/60 bg-surface'
                }`}
              >
                <span
                  className={`absolute top-1 left-1.5 text-[10px] leading-none tabular-nums ${
                    outside ? 'text-text-muted' : 'text-text'
                  }`}
                >
                  {Number(c.date.slice(8, 10))}
                </span>
                {!outside && <Bloom level={level} size={26} peak={c.date === peak?.date} />}
                <span className="sr-only">{dayTitle(c)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // month labels over the week where each month starts
  const weeks = Math.ceil(cells.length / 7);
  const monthMarks: { col: number; label: string }[] = [];
  for (let w = 0; w < weeks; w++) {
    const firstReal = cells.slice(w * 7, w * 7 + 7).find((c) => c.date >= days[0].date);
    if (!firstReal) continue;
    const m = firstReal.date.slice(0, 7);
    const prev = monthMarks[monthMarks.length - 1];
    if (!prev || prev.label !== m) monthMarks.push({ col: w, label: m });
  }

  const CELL = 15;
  const GAP = 3;
  return (
    <div ref={scroller} className="overflow-x-auto botanical-scrollbar pb-2 -mx-1 px-1">
      <div className="inline-flex gap-2">
        <div className="grid pt-5 text-[10px] text-text-muted" style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, rowGap: GAP }}>
          {WEEKDAYS.map((w, i) => (
            <span key={w} className="leading-[15px]">
              {i % 2 === 0 ? w : ''}
            </span>
          ))}
        </div>
        <div>
          <div className="relative h-5 text-[10px] font-semibold text-text-muted" style={{ width: weeks * (CELL + GAP) }}>
            {monthMarks.map((m) => (
              <span key={m.label} className="absolute top-0 whitespace-nowrap" style={{ left: m.col * (CELL + GAP) }}>
                T{Number(m.label.slice(5))}
                {m.label.slice(5) === '01' || m === monthMarks[0] ? `/${m.label.slice(2, 4)}` : ''}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col"
            style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoColumns: `${CELL}px`, gap: GAP }}
          >
            {cells.map((c, i) =>
              c.count === null ? (
                <span key={c.date + i} aria-hidden="true" />
              ) : (
                <span key={c.date} title={dayTitle(c)} className="flex items-center justify-center">
                  <Bloom level={bloomLevel(c.count)} size={CELL} peak={c.date === peak?.date} />
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BloomLegend: React.FC = () => (
  <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-text-muted" aria-label="Mức độ đơm hoa">
    {BLOOM_LEVELS.map((l, i) => (
      <li key={l.label} className="flex items-center gap-1">
        <Bloom level={i as 0 | 1 | 2 | 3 | 4} size={14} />
        <span>
          {l.label} <span>({l.range})</span>
        </span>
      </li>
    ))}
  </ul>
);
