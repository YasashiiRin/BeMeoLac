import React from 'react';
import { Strength } from './passwordStrength';

const COLOR = ['text-border-strong', 'text-danger', 'text-chart-5', 'text-leaf', 'text-primary'];
const WAVE = 'M2 14 C 22 4, 38 24, 58 14 S 94 4, 114 14 S 150 24, 170 14 S 206 4, 226 14 S 262 24, 282 14 S 318 4, 338 14 S 374 24, 398 14';

/** Password strength as a vine that grows leaves (and finally a flower) as it gets stronger. */
export const VineStrength: React.FC<{ strength: Strength; id?: string }> = ({ strength, id }) => {
  const pct = (strength.score / 4) * 100;
  const clip = `vine-${React.useId().replace(/:/g, '')}`;
  return (
    <div id={id} className="flex flex-col gap-1.5" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Độ bền mật khẩu</span>
        <span className="font-semibold text-text">{strength.label}</span>
      </div>
      <div
        role="meter"
        aria-label="Độ bền mật khẩu"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={strength.score}
        aria-valuetext={strength.label}
        className={`relative h-7 ${COLOR[strength.score]}`}
      >
        <svg viewBox="0 0 400 28" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
          <path d={WAVE} fill="none" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-border" />
          <defs>
            <clipPath id={clip}>
              <rect x="0" y="0" height="28" width={pct * 4} className="transition-[width] duration-500 ease-out" />
            </clipPath>
          </defs>
          <path
            d={WAVE}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            clipPath={`url(#${clip})`}
          />
        </svg>
        {[1, 2, 3, 4].map((step) => {
          const on = strength.score >= step;
          const flower = step === 4;
          return (
            <svg
              key={step}
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`absolute top-1/2 w-5 h-5 transition-all duration-500 ${on ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{ left: `calc(${(step / 4) * 100}% - ${flower ? 12 : 22}px)`, translate: '0 -50%' }}
            >
              {flower ? (
                <>
                  {[0, 72, 144, 216, 288].map((a) => (
                    <ellipse key={a} cx="10" cy="5" rx="3.3" ry="4.3" transform={`rotate(${a} 10 10)`} className="fill-chart-2" />
                  ))}
                  <circle cx="10" cy="10" r="2.6" className="fill-chart-3" />
                </>
              ) : (
                <path d="M4 16 C4 8 10 4 17 4 C17 11 12 16 4 16 Z" fill="currentColor" />
              )}
            </svg>
          );
        })}
      </div>
    </div>
  );
};
