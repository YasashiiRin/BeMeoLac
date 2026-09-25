import React, { useEffect, useMemo, useRef } from 'react';
import { seeded } from './random';
import { usePageVisible, usePrefersReducedMotion } from './useMotionPrefs';

/*
 * Ornaments positioned relative to the form frame (the frame box is the
 * containing block). All line art uses --orn-line / --orn-line-light.
 */

const f = (n: number) => n.toFixed(2);

export function fourPointStar(cx: number, cy: number, r: number, inner = 0.28) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = (i * 45 - 90) * (Math.PI / 180);
    d += `${i === 0 ? 'M' : 'L'}${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))} `;
  }
  return d + 'Z';
}

/* ── 2. Medallion: sun-ray halo around the arch crescent ────────────── */

export const ArchMedallion: React.FC = () => {
  const rays = useMemo(() => {
    let d = '';
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r1 = 19;
      const r2 = i % 4 === 0 ? 34 : i % 2 === 0 ? 29 : 25;
      d += `M${f(Math.cos(a) * r1)},${f(Math.sin(a) * r1)} L${f(Math.cos(a) * r2)},${f(Math.sin(a) * r2)} `;
    }
    return d;
  }, []);
  return (
    <div className="orn-layer orn-medallion orn-late" aria-hidden="true" data-part="arch-medallion">
      <span className="orn-medallion-glow" />
      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="-48 -48 96 96">
        <circle r={16.5} className="orn-stroke" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <circle r={38} className="orn-stroke" strokeWidth={1} strokeDasharray="0.6 3.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="orn-medallion-rays">
        <svg className="w-full h-full overflow-visible" viewBox="-48 -48 96 96">
          <path d={rays} className="orn-stroke" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return <path key={deg} d={fourPointStar(Math.cos(a) * 41, Math.sin(a) * 41, 3.2)} className="orn-fill-light" />;
          })}
        </svg>
      </div>
    </div>
  );
};

/* ── 3. Orbit rings with tiny planets ───────────────────────────────── */

const ellipse = (rx: number, ry: number) => `M${-rx},0 a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`;

export const OrbitRings: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const visible = usePageVisible();
  const reduced = usePrefersReducedMotion();

  // SMIL motion: pause with the tab / reduced motion
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!visible || reduced) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [visible, reduced]);

  const orbits = [
    { id: 'orbit-a', rx: 60, ry: 12, rot: -9, dur: 11, r: 2.2, reverse: false },
    { id: 'orbit-b', rx: 76, ry: 18, rot: 11, dur: 17, r: 1.6, reverse: true },
  ];

  return (
    <svg ref={svgRef} className="orn-layer orn-orbits orn-late overflow-visible" viewBox="-85 -35 170 70" aria-hidden="true" data-part="orbits">
      {orbits.map((o) => (
        <g key={o.id} transform={`rotate(${o.rot})`}>
          <path id={o.id} d={ellipse(o.rx, o.ry)} className="orn-stroke" strokeWidth={0.8} vectorEffect="non-scaling-stroke" opacity={0.8} />
          <g data-planet={o.id} data-dur={o.dur} data-reverse={o.reverse ? '1' : undefined}>
            <circle r={o.r * 2.4} className="orn-fill-light" opacity={0.25} />
            <circle r={o.r} className="orn-fill-light" />
            <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" rotate="0" {...(o.reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}>
              <mpath href={`#${o.id}`} />
            </animateMotion>
          </g>
        </g>
      ))}
    </svg>
  );
};

/* ── 4. Star chains hanging from above the arch ─────────────────────── */

const CHAIN_H = 380; // tall so the top always runs off-screen

const StarChain: React.FC<{ left: string; drop: number; delay: string; duration: string }> = ({ left, drop, delay, duration }) => {
  // ornaments sit in the bottom `drop` px; the rest is a plain thread
  const top = CHAIN_H - drop;
  const beads = [];
  for (let y = top + 10; y < CHAIN_H - 26; y += 11) beads.push(y);
  return (
    <div
      className="orn-layer orn-chain orn-late"
      style={{ left, height: CHAIN_H, ['--delay' as string]: delay, ['--d' as string]: duration }}
      aria-hidden="true"
      data-part="star-chain"
    >
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 14 ${CHAIN_H}`}>
        <path d={`M7,0 V${CHAIN_H - 22}`} className="orn-stroke" strokeWidth={0.8} vectorEffect="non-scaling-stroke" opacity={0.7} />
        {beads.map((y, i) =>
          i % 3 === 1 ? (
            <path key={y} d={`M7,${y - 3.2} L9.2,${y} L7,${y + 3.2} L4.8,${y} Z`} className="orn-stroke" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
          ) : (
            <circle key={y} cx={7} cy={y} r={1.1} className="orn-fill" />
          )
        )}
        <circle cx={7} cy={CHAIN_H - 22} r={2.6} className="orn-stroke" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
        <path d={fourPointStar(7, CHAIN_H - 9, 7)} className="orn-fill-light" />
      </svg>
    </div>
  );
};

export const StarChains: React.FC = () => (
  <>
    <StarChain left="calc(26% - 7px)" drop={92} delay="-1.5s" duration="6.5s" />
    <StarChain left="calc(74% - 7px)" drop={70} delay="-4s" duration="8s" />
  </>
);

/* ── 5. Sparkles twinkling around the frame ─────────────────────────── */

const SPARKLE_SPOTS: [number, number][] = [
  [-6, 12], [105, 8], [-8, 34], [107, 29], [-4, 55], [105, 57], [-7, 77], [104, 81],
  [8, 101], [92, 102], [29, 106], [71, 105], [16, -1], [84, -2], [-3, 94], [102, 44],
];

export const FrameSparkles: React.FC = () => {
  const sparkles = useMemo(() => {
    const rand = seeded(88);
    return SPARKLE_SPOTS.map(([x, y]) => ({
      x,
      y,
      size: 7 + rand() * 6,
      d: 4 + rand() * 5,
      delay: -rand() * 9,
      light: rand() < 0.5,
    }));
  }, []);
  return (
    <div className="orn-layer inset-0" data-part="frame-sparkles">
      {sparkles.map((s, i) => (
        <svg
          key={i}
          className="orn-layer orn-sparkle orn-late"
          style={{ left: `${s.x}%`, top: `${s.y}%`, ['--s' as string]: `${s.size}px`, ['--d' as string]: `${s.d}s`, ['--delay' as string]: `${s.delay}s` }}
          viewBox="-10 -10 20 20"
          aria-hidden="true"
        >
          <path d={fourPointStar(0, 0, 10, 0.22)} className={s.light ? 'orn-fill-light' : 'orn-fill'} />
        </svg>
      ))}
    </div>
  );
};

/* ── 7. Moon phases below the form ──────────────────────────────────── */

/** Lit part of a moon of radius r; t = illuminated fraction, waxing = right side lit. */
function litPath(r: number, t: number) {
  if (t >= 0.999) return `M0,${-r} A${r},${r} 0 1,1 0,${r} A${r},${r} 0 1,1 0,${-r} Z`;
  const rx = Math.abs(1 - 2 * t) * r;
  const sweep = t > 0.5 ? 1 : 0;
  return `M0,${-r} A${r},${r} 0 0,1 0,${r} A${f(rx)},${r} 0 0,${sweep} 0,${-r} Z`;
}

export const MoonPhases: React.FC = () => {
  const phases = [
    { t: 0.18, wax: true },
    { t: 0.5, wax: true },
    { t: 0.8, wax: true },
    { t: 1, wax: true },
    { t: 0.8, wax: false },
    { t: 0.5, wax: false },
    { t: 0.18, wax: false },
  ];
  return (
    <div className="orn-layer orn-phases orn-late flex items-center gap-2.5" aria-hidden="true" data-part="moon-phases">
      {phases.map((p, i) => (
        <svg key={i} className="orn-phase w-3 h-3 overflow-visible" viewBox="-7 -7 14 14" style={{ ['--delay' as string]: `${i * 0.7}s` }}>
          <circle r={5.5} className="orn-stroke" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
          <path d={litPath(5.5, p.t)} className="orn-fill-light" transform={p.wax ? undefined : 'scale(-1,1)'} />
        </svg>
      ))}
    </div>
  );
};
