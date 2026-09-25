import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, TooltipContentProps } from 'recharts';
import { usePrefersReducedMotion } from '../login/ornaments/useMotionPrefs';
import { formatNumber, percent } from './format';

interface GenreDonutProps {
  genres: { name: string; count: number }[];
  /** distinct comics read in the period (the donut's center) */
  comicsRead: number;
}

const SLICE_FILL = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5', 'fill-chart-6'];
const SLICE_BG = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6'];
const TOP = 5;

type Slice = { name: string; count: number };

const SliceTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload as Slice;
  return (
    <div className="rounded-xl border border-border bg-surface-raised px-3 py-2 shadow-botanical text-xs">
      <div className="font-semibold text-text">{s.name}</div>
      <div className="text-text-muted">{s.count} bộ truyện</div>
    </div>
  );
};

export const GenreDonut: React.FC<GenreDonutProps> = ({ genres, comicsRead }) => {
  const reduced = usePrefersReducedMotion();
  const rest = genres.slice(TOP);
  // the long tail of small tags would swamp the ring, so it only gets a note
  const slices: Slice[] = genres.slice(0, TOP);

  return (
    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5">
      <div className="relative w-44 h-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="name"
              innerRadius="64%"
              outerRadius="96%"
              paddingAngle={2}
              cornerRadius={6}
              stroke="var(--c-surface-raised)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={!reduced}
              animationDuration={800}
            >
              {slices.map((s, i) => (
                <Cell key={s.name} className={SLICE_FILL[i]} />
              ))}
            </Pie>
            <Tooltip content={SliceTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-lg" aria-hidden="true">💐</span>
          <span className="font-serif text-2xl font-bold text-text leading-none">{formatNumber(comicsRead)}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mt-1">bộ truyện</span>
        </div>
      </div>

      <ul className="w-full flex flex-col gap-1.5">
        {slices.map((s, i) => (
          <li
            key={s.name}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface/70 px-3 py-1.5 text-sm"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className={`w-3 h-3 rounded-full shrink-0 ${SLICE_BG[i]}`} aria-hidden="true" />
              <span className="truncate font-semibold text-text">{s.name}</span>
            </span>
            <span className="flex items-center gap-2.5 shrink-0 tabular-nums">
              <span className="text-xs text-text-muted">{s.count} bộ</span>
              <span className="w-9 text-right text-xs font-bold text-text">{percent(s.count, comicsRead)}%</span>
            </span>
          </li>
        ))}
        {rest.length > 0 && (
          <li className="px-3 pt-0.5 text-xs text-text-muted">và {rest.length} thể loại khác nàng từng ghé qua</li>
        )}
      </ul>
    </div>
  );
};
