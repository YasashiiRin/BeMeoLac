import React from 'react';

export type PlantStage = 0 | 1 | 2 | 3;

export const PLANT_STAGE_LABELS = ['Hạt giống', 'Mầm non', 'Cây nhỏ', 'Hoa nở'] as const;

/** Stage from a value and the thresholds for sprout / small plant / bloom. */
export const plantStage = (value: number, [sprout, plant, bloom]: [number, number, number]): PlantStage =>
  value >= bloom ? 3 : value >= plant ? 2 : value >= sprout ? 1 : 0;

interface PlantProps {
  stage: PlantStage;
  /** petal color class for the bloom, e.g. "fill-chart-2" */
  petal?: string;
  className?: string;
}

/** A little potted plant: seed → sprout → small plant → blooming flower. */
export const Plant: React.FC<PlantProps> = ({ stage, petal = 'fill-chart-2', className = '' }) => (
  <svg
    viewBox="0 0 48 48"
    role="img"
    aria-label={PLANT_STAGE_LABELS[stage]}
    className={`w-12 h-12 shrink-0 ${className}`}
  >
    <title>{PLANT_STAGE_LABELS[stage]}</title>
    {/* plant (re-mounts per stage so it grows again) */}
    <g key={stage} className="stats-plant-grow">
      {stage === 0 && <ellipse cx="24" cy="35" rx="3.2" ry="2.2" className="fill-chart-5" />}
      {stage >= 1 && (
        <path
          d={stage === 1 ? 'M24 37 V29' : stage === 2 ? 'M24 37 V20' : 'M24 37 V15'}
          className="stroke-chart-1"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {stage === 1 && (
        <>
          <path d="M24 30 C20 30 18.5 27.5 18.5 25.5 C21.5 25.5 24 27 24 30 Z" className="fill-chart-1" />
          <path d="M24 30 C28 30 29.5 27.5 29.5 25.5 C26.5 25.5 24 27 24 30 Z" className="fill-chart-1" />
        </>
      )}
      {stage >= 2 && (
        <>
          <path d="M24 32 C18.5 32 16 28.5 16 26 C20.5 26 24 28.5 24 32 Z" className="fill-chart-1" />
          <path d="M24 28 C29.5 28 32 24.5 32 22 C27.5 22 24 24.5 24 28 Z" className="fill-chart-1" />
          <path d="M24 24 C19.5 24 18 21 18 19.5 C21.5 19.5 24 21.5 24 24 Z" className="fill-chart-1 opacity-80" />
        </>
      )}
      {stage === 3 && (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="24" cy="9.6" rx="3" ry="4.4" transform={`rotate(${a} 24 14)`} className={petal} />
          ))}
          <circle cx="24" cy="14" r="2.6" className="fill-chart-3" />
        </g>
      )}
    </g>
    {/* soil + pot */}
    <path d="M13 36 H35 L32.5 45 H15.5 Z" className="fill-surface-sunken stroke-border-strong" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="11.5" y="34" width="25" height="4" rx="1.6" className="fill-surface-raised stroke-border-strong" strokeWidth="1.2" />
  </svg>
);
