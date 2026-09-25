import React, { useEffect, useMemo, useRef, useState } from 'react';
import { seeded } from './random';
import { usePageVisible, usePrefersReducedMotion } from './useMotionPrefs';

/*
 * Full-screen ornaments over the night-sky background (below the form).
 */

/* ── Artwork box: where the portrait image actually sits ─────────────── */

const IMG_W = 736;
const IMG_H = 1308;

/**
 * The artwork always fills the scene height and is centered (see
 * .celestial-sky): scale s = h / IMG_H, left offset ox (negative when the
 * sides are cropped on narrow screens, positive when emerald bands show).
 */
function useArtBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const art = box && box.h > 0 ? { ...box, s: box.h / IMG_H, ox: (box.w - (IMG_W * box.h) / IMG_H) / 2 } : null;
  return { ref, art };
}

/** Positions its children over the artwork; children use % of the image. */
const OverArt: React.FC<{ children: (art: NonNullable<ReturnType<typeof useArtBox>['art']>) => React.ReactNode; part: string }> = ({
  children,
  part,
}) => {
  const { ref, art } = useArtBox();
  return (
    <div ref={ref} className="orn-layer inset-0 overflow-hidden" aria-hidden="true" data-part={part}>
      {art && (
        <div className="absolute top-0 h-full" style={{ left: art.ox, width: IMG_W * art.s }}>
          {children(art)}
        </div>
      )}
    </div>
  );
};

/* ── 6. Constellations near the clouds (image coordinates) ───────────── */

interface ConstellationDef {
  /** star positions in image pixels (736 × 1308) */
  stars: [number, number][];
  lines: [number, number][];
  delay: number;
}

const CONSTELLATIONS: ConstellationDef[] = [
  // by the upper-right clouds
  { stars: [[550, 78], [598, 124], [640, 65], [619, 190], [574, 222]], lines: [[0, 1], [1, 2], [1, 3], [3, 4]], delay: 0 },
  // above the lower-left clouds
  { stars: [[108, 1217], [157, 1171], [208, 1224], [259, 1178], [181, 1276]], lines: [[0, 1], [1, 2], [2, 3], [2, 4]], delay: -5.5 },
];

/** Line + star constellation drawn in a box; points are given in % of the box. */
const ConstellationShape: React.FC<{ stars: [number, number][]; lines: [number, number][]; delay: number }> = ({ stars, lines, delay }) => (
  <div className="orn-layer inset-0 orn-late" data-part="constellation">
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={stars[a][0]}
          y1={stars[a][1]}
          x2={stars[b][0]}
          y2={stars[b][1]}
          pathLength={1}
          className="orn-stroke orn-const-line"
          strokeWidth={0.9}
          vectorEffect="non-scaling-stroke"
          style={{ ['--delay' as string]: `${delay + i * 0.25}s` }}
        />
      ))}
    </svg>
    {stars.map(([x, y], i) => (
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
);

export const Constellations: React.FC = () => (
  <OverArt part="constellations">
    {() =>
      CONSTELLATIONS.map((c, ci) => (
        <ConstellationShape
          key={ci}
          stars={c.stars.map(([x, y]) => [(x / IMG_W) * 100, (y / IMG_H) * 100] as [number, number])}
          lines={c.lines}
          delay={c.delay}
        />
      ))
    }
  </OverArt>
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

export const BackgroundGlows: React.FC = () => (
  <OverArt part="background-glows">
    {() =>
      GLOW_SPOTS.map((g, i) => (
        <span
          key={i}
          className="orn-layer orn-glow"
          style={{
            left: `${(g.x / IMG_W) * 100}%`,
            top: `${(g.y / IMG_H) * 100}%`,
            width: `${((g.r * 2.4) / IMG_W) * 100}%`,
            aspectRatio: '1',
            ['--d' as string]: `${g.d}s`,
            ['--delay' as string]: `${-i * 1.3}s`,
          }}
        />
      ))
    }
  </OverArt>
);

/* ── Side decorations for wide screens (the emerald bands beside the art) ── */

const MIN_BAND = 70; // px: below this the bands are too thin to decorate
const FORM_MAX = 420; // px, matches the frame box (min(86vw, 420px))
const FORM_GAP = 24; // px kept clear on each side of the form

const SideChain: React.FC<{ x: number; length: number; delay: number; duration: number }> = ({ x, length, delay, duration }) => {
  const beads: number[] = [];
  for (let y = 14; y < length - 26; y += 12) beads.push(y);
  return (
    <div
      className="orn-layer orn-side-chain orn-late"
      style={{ left: `calc(${x}% - 7px)`, height: length, ['--delay' as string]: `${delay}s`, ['--d' as string]: `${duration}s` }}
      data-part="star-chain"
    >
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 14 ${length}`}>
        <path d={`M7,0 V${length - 22}`} className="orn-stroke" strokeWidth={0.8} vectorEffect="non-scaling-stroke" opacity={0.7} />
        {beads.map((y, i) =>
          i % 3 === 1 ? (
            <path key={y} d={`M7,${y - 3.2} L9.2,${y} L7,${y + 3.2} L4.8,${y} Z`} className="orn-stroke" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
          ) : (
            <circle key={y} cx={7} cy={y} r={1.1} className="orn-fill" />
          )
        )}
        <circle cx={7} cy={length - 22} r={2.6} className="orn-stroke" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
        <path d={starPath(7, length - 9, 7)} className="orn-fill-light" />
      </svg>
    </div>
  );
};

function starPath(cx: number, cy: number, r: number, inner = 0.26) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = (i * 45 * Math.PI) / 180;
    d += `${i === 0 ? 'M' : 'L'}${(cx + rr * Math.sin(a)).toFixed(2)},${(cy - rr * Math.cos(a)).toFixed(2)} `;
  }
  return d + 'Z';
}

/** Small constellations for the bands, in % of the band. */
const SIDE_CONSTELLATIONS: { stars: [number, number][]; lines: [number, number][] }[] = [
  { stars: [[22, 48], [40, 44.5], [58, 49], [49, 55.5], [70, 57]], lines: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  { stars: [[30, 80], [52, 77], [66, 83], [44, 87.5]], lines: [[0, 1], [1, 2], [2, 3], [3, 0]] },
];

const SideBand: React.FC<{ side: 'left' | 'right'; width: number; height: number }> = ({ side, width, height }) => {
  const sparkles = useMemo(() => {
    const rand = seeded(side === 'left' ? 311 : 733);
    return Array.from({ length: 10 }, () => ({
      x: 8 + rand() * 84,
      y: 5 + rand() * 90,
      size: 6 + rand() * 7,
      d: 4 + rand() * 5,
      delay: -rand() * 9,
      light: rand() < 0.5,
    }));
  }, [side]);
  const mirror = (x: number) => (side === 'left' ? x : 100 - x);
  return (
    <div className="orn-layer top-0 h-full" style={{ [side]: 0, width }} data-part={`side-${side}`}>
      <SideChain x={mirror(30)} length={Math.round(height * 0.26)} delay={-1.2} duration={7} />
      <SideChain x={mirror(68)} length={Math.round(height * 0.4)} delay={-3.4} duration={8.5} />
      {SIDE_CONSTELLATIONS.map((c, i) => (
        <ConstellationShape
          key={i}
          stars={c.stars.map(([x, y]) => [mirror(x), y] as [number, number])}
          lines={c.lines}
          delay={side === 'left' ? -2 - i * 3 : -6.5 - i * 3}
        />
      ))}
      <div className="orn-layer inset-0" data-part="frame-sparkles">
        {sparkles.map((s, i) => (
          <svg
            key={i}
            className="orn-layer orn-sparkle orn-late"
            style={{ left: `${s.x}%`, top: `${s.y}%`, ['--s' as string]: `${s.size}px`, ['--d' as string]: `${s.d}s`, ['--delay' as string]: `${s.delay}s` }}
            viewBox="-10 -10 20 20"
          >
            <path d={starPath(0, 0, 10, 0.22)} className={s.light ? 'orn-fill-light' : 'orn-fill'} />
          </svg>
        ))}
      </div>
    </div>
  );
};

/** Chains, constellations and sparkles beside the artwork on wide screens. */
export const SideDecor: React.FC = () => {
  const { ref, art } = useArtBox();
  // the emerald band beside the art, but never reaching under the form
  const formW = art ? Math.min(art.w * 0.86, FORM_MAX) : 0;
  const band = art ? Math.floor(Math.min(art.ox, (art.w - formW) / 2 - FORM_GAP)) : 0;
  return (
    <div ref={ref} className="orn-layer inset-0 overflow-hidden" aria-hidden="true" data-part="side-decor">
      {art && band >= MIN_BAND && (
        <>
          <SideBand side="left" width={band} height={art.h} />
          <SideBand side="right" width={band} height={art.h} />
        </>
      )}
    </div>
  );
};
