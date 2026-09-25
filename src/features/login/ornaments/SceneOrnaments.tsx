import React, { useEffect, useMemo, useRef, useState } from 'react';
import { seeded } from '../../../components/gate/sceneUtils';
import { usePageVisible, usePrefersReducedMotion } from './useMotionPrefs';

/*
 * Full-screen ornaments over the night-sky background (below the form).
 */

/* ── 6. Constellations near the clouds ──────────────────────────────── */

interface ConstellationDef {
  /** star positions in % of the scene */
  stars: [number, number][];
  lines: [number, number][];
  delay: number;
}

const CONSTELLATIONS: ConstellationDef[] = [
  // top right, by the upper clouds
  { stars: [[80, 6], [88, 9.5], [95, 5], [91.5, 14.5], [84, 17]], lines: [[0, 1], [1, 2], [1, 3], [3, 4]], delay: 0 },
  // bottom left, above the lower clouds
  { stars: [[7, 93], [15, 89.5], [23.5, 93.5], [32, 90], [19, 97.5]], lines: [[0, 1], [1, 2], [2, 3], [2, 4]], delay: -5.5 },
];

export const Constellations: React.FC = () => (
  <>
    {CONSTELLATIONS.map((c, ci) => (
      <div key={ci} className="orn-layer inset-0 orn-late" aria-hidden="true" data-part="constellation">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {c.lines.map(([a, b], i) => (
            <line
              key={i}
              x1={c.stars[a][0]}
              y1={c.stars[a][1]}
              x2={c.stars[b][0]}
              y2={c.stars[b][1]}
              pathLength={1}
              className="orn-stroke orn-const-line"
              strokeWidth={0.9}
              vectorEffect="non-scaling-stroke"
              style={{ ['--delay' as string]: `${c.delay + i * 0.25}s` }}
            />
          ))}
        </svg>
        {c.stars.map(([x, y], i) => (
          <span
            key={i}
            className="orn-const-star absolute w-[5px] h-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: 'var(--orn-line-light)',
              boxShadow: '0 0 6px var(--orn-line-light)',
              ['--delay' as string]: `${-i * 0.9}s`,
            }}
          />
        ))}
      </div>
    ))}
  </>
);

/* ── 8. Shooting star every 8–15 s across the upper area ────────────── */

export const ShootingStars: React.FC = () => {
  const [stars, setStars] = useState<{ id: number; style: React.CSSProperties }[]>([]);
  const visible = usePageVisible();
  const reduced = usePrefersReducedMotion();
  const nextId = useRef(0);

  useEffect(() => {
    if (!visible || reduced) return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const angle = 150 + Math.random() * 25; // leftward, slightly down
        const dist = window.innerWidth * (0.45 + Math.random() * 0.2);
        const a = (angle * Math.PI) / 180;
        const id = nextId.current++;
        setStars((s) => [
          ...s,
          {
            id,
            style: {
              left: `${55 + Math.random() * 38}%`,
              top: `${4 + Math.random() * 24}%`,
              rotate: `${angle}deg`,
              ['--dx' as string]: `${(Math.cos(a) * dist).toFixed(0)}px`,
              ['--dy' as string]: `${(Math.sin(a) * dist).toFixed(0)}px`,
            },
          },
        ]);
        schedule();
      }, 8000 + Math.random() * 7000);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [visible, reduced]);

  return (
    <div className="orn-layer inset-0 overflow-hidden" aria-hidden="true" data-part="shooting-stars">
      {stars.map((s) => (
        <span key={s.id} className="orn-shooting-star" style={s.style} onAnimationEnd={() => setStars((all) => all.filter((x) => x.id !== s.id))} />
      ))}
    </div>
  );
};

/* ── 9. Floating gold dust ──────────────────────────────────────────── */

export const GoldDust: React.FC<{ count?: number }> = ({ count = 22 }) => {
  const motes = useMemo(() => {
    const rand = seeded(64);
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      s: 1.2 + rand() * 1.8,
      d: 16 + rand() * 14,
      delay: -rand() * 30,
      drift: (rand() - 0.5) * 44,
      o: 0.35 + rand() * 0.45,
    }));
  }, [count]);
  return (
    <div className="orn-layer inset-0 overflow-hidden" aria-hidden="true" data-part="gold-dust">
      {motes.map((m, i) => (
        <span
          key={i}
          className="orn-layer orn-dust"
          style={{
            left: `${m.left}%`,
            ['--s' as string]: `${m.s}px`,
            ['--d' as string]: `${m.d}s`,
            ['--delay' as string]: `${m.delay}s`,
            ['--drift' as string]: `${m.drift}px`,
            ['--o' as string]: m.o,
          }}
        />
      ))}
    </div>
  );
};

/* ── 10. Breathing glows on the background's moons and sun rays ─────── */

const IMG_W = 736;
const IMG_H = 1308;

/** Features of login-celestial-night.jpg in its own pixel coordinates. */
const GLOW_SPOTS: { x: number; y: number; r: number; d: number }[] = [
  { x: 30, y: 22, r: 95, d: 7 }, // sun rays, top left
  { x: 101, y: 300, r: 20, d: 5.5 }, // small crescent
  { x: 55, y: 612, r: 44, d: 6.5 }, // large crescent
  { x: 45, y: 1030, r: 48, d: 8 }, // geometric circle, bottom left
  { x: 651, y: 757, r: 34, d: 6 }, // full moon, right
  { x: 651, y: 650, r: 22, d: 7.5 }, // waxing phases
  { x: 651, y: 860, r: 22, d: 7 }, // waning phases
  { x: 370, y: 70, r: 26, d: 5 }, // top star
  { x: 650, y: 1105, r: 24, d: 6 }, // lower right star
  { x: 645, y: 1262, r: 95, d: 8.5 }, // sun + crescent, bottom right
];

export const BackgroundGlows: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // same math as object-fit: cover + object-position: center
  const spots = useMemo(() => {
    if (!box) return [];
    const s = Math.max(box.w / IMG_W, box.h / IMG_H);
    const ox = (box.w - IMG_W * s) / 2;
    const oy = (box.h - IMG_H * s) / 2;
    return GLOW_SPOTS.map((g, i) => ({
      left: ox + g.x * s,
      top: oy + g.y * s,
      size: g.r * s * 2.4,
      d: g.d,
      delay: -i * 1.3,
    }));
  }, [box]);

  return (
    <div ref={ref} className="orn-layer inset-0 overflow-hidden" aria-hidden="true" data-part="background-glows">
      {spots.map((g, i) => (
        <span
          key={i}
          className="orn-layer orn-glow"
          style={{ left: g.left, top: g.top, width: g.size, height: g.size, ['--d' as string]: `${g.d}s`, ['--delay' as string]: `${g.delay}s` }}
        />
      ))}
    </div>
  );
};
