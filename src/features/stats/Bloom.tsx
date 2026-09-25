import React from 'react';

const PETALS = [0, 72, 144, 216, 288];
const LEVEL_COLOR = ['', 'text-chart-1', 'text-chart-1', 'text-chart-2', 'text-chart-4'];
const LEVEL_SCALE = [0, 0.55, 0.72, 0.86, 1];

interface BloomProps {
  level: 0 | 1 | 2 | 3 | 4;
  size?: number;
  /** today's cell / record day */
  peak?: boolean;
  className?: string;
}

/**
 * One reading-calendar day: bare soil when nàng rested, otherwise a flower
 * whose size and color grow with the chapters read. Glows in the night theme.
 */
export const Bloom: React.FC<BloomProps> = ({ level, size = 14, peak = false, className = '' }) => {
  if (level === 0) {
    return (
      <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className={className}>
        <circle cx="10" cy="10" r="3" className="fill-border" />
      </svg>
    );
  }
  const s = LEVEL_SCALE[level];
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      className={`${LEVEL_COLOR[level]} ${level >= 2 ? 'stats-bloom-lit' : ''} ${peak ? 'is-peak' : ''} ${className}`}
    >
      <g transform={`translate(10 10) scale(${s}) translate(-10 -10)`}>
        {level === 1 ? (
          // bud: a closed flower on a leaf
          <>
            <path d="M10 17 C6 17 4.5 13.5 4.5 12 C8 12 10 14 10 17 Z" className="fill-chart-1 opacity-70" />
            <ellipse cx="10" cy="9" rx="4" ry="5.5" fill="currentColor" />
          </>
        ) : (
          <>
            {PETALS.map((a) => (
              <ellipse key={a} cx="10" cy="4.6" rx="3.6" ry="4.6" transform={`rotate(${a} 10 10)`} fill="currentColor" />
            ))}
            <circle cx="10" cy="10" r="2.8" className="fill-chart-3" />
          </>
        )}
      </g>
    </svg>
  );
};
