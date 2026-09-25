import React from 'react';
import { Bar, BarChart, BarShapeProps, CartesianGrid, ResponsiveContainer, Tooltip, TooltipContentProps, XAxis, YAxis } from 'recharts';
import { usePrefersReducedMotion } from '../login/ornaments/useMotionPrefs';
import { formatNumber, monthLabel, monthLong } from './format';

interface MonthlyChartProps {
  months: { month: string; count: number }[];
  /** the month to crown (usually the best one) */
  peakMonth?: string;
}

type Row = { month: string; label: string; count: number; peak: boolean; current: boolean };

const PETALS = [0, 72, 144, 216, 288];

/** A bar drawn as a stem that grows up, with leaves and a flower on top. */
const Stem = (props: BarShapeProps & { maxCount: number }) => {
  const { x = 0, y = 0, width = 0, height = 0, maxCount } = props;
  const row = props.payload as Row;
  const cx = x + width / 2;
  const bottom = y + height;
  const stem = Math.max(3, Math.min(6, width * 0.16));
  const leaves: { ly: number; side: 1 | -1 }[] = [];
  for (let ly = bottom - 18, i = 0; ly > y + 16; ly -= 26, i++) leaves.push({ ly, side: i % 2 ? -1 : 1 });
  const ratio = maxCount > 0 ? row.count / maxCount : 0;
  const r = row.peak ? 8 : 3.5 + 3.5 * ratio; // flower grows with the count
  const petal = row.peak ? 'fill-chart-4' : row.current ? 'fill-chart-2' : 'fill-chart-2 opacity-85';

  return (
    <g>
      <rect x={cx - stem / 2} y={y} width={stem} height={Math.max(0, height)} rx={stem / 2} className="fill-chart-1" />
      {leaves.map(({ ly, side }) => (
        <path
          key={ly}
          d={`M${cx} ${ly} q ${side * 9} -1 ${side * 11} -9 q ${side * -8} -1 ${side * -11} 9 z`}
          className="fill-chart-1 opacity-75"
        />
      ))}
      {row.count > 0 && height > 0 && (
        <g transform={`translate(${cx} ${y})`}>
          {PETALS.map((a) => (
            <ellipse key={a} cx="0" cy={-r * 0.55} rx={r * 0.42} ry={r * 0.58} transform={`rotate(${a})`} className={petal} />
          ))}
          <circle r={r * 0.34} className="fill-chart-3" />
        </g>
      )}
      <text
        x={cx}
        y={y - r - 8}
        textAnchor="middle"
        className={`text-[11px] tabular-nums ${row.peak ? 'fill-text font-bold' : 'fill-text-muted font-semibold'}`}
      >
        {formatNumber(row.count)}
      </text>
    </g>
  );
};

const Tick = (props: { x?: number; y?: number; payload?: { value: string }; rows: Row[] }) => {
  const row = props.rows.find((r) => r.label === props.payload?.value);
  return (
    <text
      x={props.x}
      y={(props.y ?? 0) + 12}
      textAnchor="middle"
      className={`text-[11px] ${row?.peak || row?.current ? 'fill-text font-bold' : 'fill-text-muted font-semibold'}`}
    >
      {props.payload?.value}
    </text>
  );
};

const ChartTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  return (
    <div className="rounded-xl border border-border bg-surface-raised px-3 py-2 shadow-botanical text-xs">
      <div className="font-semibold text-text">{monthLong(row.month)}</div>
      <div className="text-text-muted">
        {formatNumber(row.count)} chương{row.peak ? ' · bội thu nhất 🌸' : ''}
      </div>
    </div>
  );
};

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ months, peakMonth }) => {
  const reduced = usePrefersReducedMotion();
  const years = new Set(months.map((m) => m.month.slice(0, 4)));
  const current = months[months.length - 1]?.month;
  const rows: Row[] = months.map((m) => ({
    ...m,
    label: monthLabel(m.month, years.size > 1),
    peak: m.month === peakMonth,
    current: m.month === current,
  }));
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="overflow-x-auto botanical-scrollbar -mx-1 px-1 pb-1">
      <div className="h-64" style={{ minWidth: Math.max(rows.length * 46, 280) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 34, right: 8, bottom: 4, left: 8 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="var(--c-border)" />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: 'var(--c-border-strong)' }}
              tickLine={false}
              interval={0}
              tick={<Tick rows={rows} />}
            />
            <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.08)]} />
            <Tooltip content={ChartTooltip} cursor={{ fill: 'var(--c-primary-tint)', opacity: 0.55 }} />
            <Bar
              dataKey="count"
              name="Chương"
              shape={(p: BarShapeProps) => <Stem {...p} maxCount={maxCount} />}
              isAnimationActive={!reduced}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
