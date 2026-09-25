import React, { useEffect, useId, useMemo, useRef } from 'react';
import { ZODIAC_GLYPHS } from './zodiacGlyphs';
import { CONSTELLATIONS, ROMAN, ZODIAC_NAMES } from './zodiacData';
import { WheelController } from './wheelController';
import { usePrefersReducedMotion } from './useMotionPrefs';

/*
 * Zodiac wheel behind the form (reference layout, outside → in):
 *   outer     names on a circle + constellations + thin dotted circle   (cw 120s)
 *   numerals  Roman numerals I–XII                                     (ccw 90s)
 *   glyphs    the 12 signs as SVG paths                                (cw 70s)
 *   inner     fine radial ticks + dotted circle                         (ccw 50s)
 *   moon      crescent + three stars, breathing glow, no rotation
 * Every ring is its own layer, sized to the ring and sharing one center, and
 * draws its 12 dividers only inside its own band, so rings can turn freely.
 * Rotation is driven by WheelController (one rAF loop).
 */

const f = (n: number) => n.toFixed(2);
/** point at `r` for an angle measured clockwise from 12 o'clock */
const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: r * Math.sin(a), y: -r * Math.cos(a) };
};
const segCenter = (i: number) => i * 30 + 15;

function dividers(r1: number, r2: number) {
  let d = '';
  for (let i = 0; i < 12; i++) {
    const p = at(r1, i * 30);
    const q = at(r2, i * 30);
    d += `M${f(p.x)},${f(p.y)} L${f(q.x)},${f(q.y)} `;
  }
  return d;
}

function fourStar(cx: number, cy: number, r: number, inner = 0.26) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = (i * 45 * Math.PI) / 180;
    d += `${i === 0 ? 'M' : 'L'}${f(cx + rr * Math.sin(a))},${f(cy - rr * Math.cos(a))} `;
  }
  return d + 'Z';
}

const line = {
  className: 'orn-stroke orn-draw',
  pathLength: 1,
  vectorEffect: 'non-scaling-stroke' as const,
};

/** Ring layer: square, centered in the wheel, `size` = diameter as % of the wheel. */
const RingLayer = React.forwardRef<HTMLDivElement, { ring: string; half: number; order: number; children: React.ReactNode }>(
  ({ ring, half, order, children }, ref) => {
    const size = (half / 500) * 100;
    return (
      <div
        ref={ref}
        className="orn-ring-layer"
        data-ring={ring}
        style={{ width: `${size}%`, height: `${size}%`, left: `${(100 - size) / 2}%`, top: `${(100 - size) / 2}%`, ['--ring-order' as string]: order }}
      >
        <svg viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`} className="w-full h-full overflow-visible">
          {children}
        </svg>
      </div>
    );
  }
);
RingLayer.displayName = 'RingLayer';

export const ZodiacWheel: React.FC<{ controllerRef?: React.MutableRefObject<WheelController | null> }> = ({ controllerRef }) => {
  const id = useId().replace(/:/g, '');
  const reduced = usePrefersReducedMotion();
  const outerRef = useRef<HTMLDivElement>(null);
  const numeralsRef = useRef<HTMLDivElement>(null);
  const glyphsRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = new WheelController({
      outer: outerRef.current,
      numerals: numeralsRef.current,
      glyphs: glyphsRef.current,
      inner: innerRef.current,
    });
    if (controllerRef) controllerRef.current = c;
    if (!reduced) c.start(); // reduced motion: static wheel
    return () => {
      c.destroy();
      if (controllerRef && controllerRef.current === c) controllerRef.current = null;
    };
  }, [reduced, controllerRef]);

  const constellations = useMemo(
    () =>
      CONSTELLATIONS.map((c, i) => {
        const pts = c.points.map(([da, r]) => at(r, segCenter(i) + da));
        const d = c.edges.map(([a, b]) => `M${f(pts[a].x)},${f(pts[a].y)} L${f(pts[b].x)},${f(pts[b].y)}`).join(' ');
        return { pts, d };
      }),
    []
  );

  const ticks = useMemo(() => {
    let d = '';
    for (let a = 0; a < 360; a += 3) {
      if (a % 30 === 0) continue;
      const p = at(152, a);
      const q = at(a % 15 === 0 ? 174 : 168, a);
      d += `M${f(p.x)},${f(p.y)} L${f(q.x)},${f(q.y)} `;
    }
    return d;
  }, []);

  const namesR = 453;
  const circumference = 2 * Math.PI * namesR;

  return (
    <div className="orn-layer orn-wheel" aria-hidden="true" data-part="zodiac-wheel">
      <div className="orn-wheel-part orn-wheel-intro">
        <div className="orn-wheel-part orn-wheel-vortex" data-spiral-wheel>
          {/* 1–3. names, constellations, dotted circle */}
          <RingLayer ref={outerRef} ring="outer" half={500} order={0}>
            <defs>
              <path id={`${id}-names`} d={`M0,${-namesR} A${namesR},${namesR} 0 1,1 0,${namesR} A${namesR},${namesR} 0 1,1 0,${-namesR}`} />
            </defs>
            <circle r={486} strokeWidth={1.2} {...line} />
            <circle r={438} strokeWidth={1} {...line} />
            <path d={dividers(438, 486)} strokeWidth={1} {...line} />
            <g className="orn-fill-light orn-wheel-text" fontSize={23} letterSpacing={2.5} style={{ fontFamily: 'var(--font-sans)' }}>
              {ZODIAC_NAMES.map((name, i) => (
                <text key={name} dominantBaseline="middle">
                  <textPath href={`#${id}-names`} startOffset={(segCenter(i) / 360) * circumference} textAnchor="middle">
                    {name}
                  </textPath>
                </text>
              ))}
            </g>
            <path d={dividers(338, 438)} strokeWidth={1} {...line} />
            <circle r={338} strokeWidth={1} {...line} />
            {constellations.map((c, i) => (
              <g key={i} data-constellation={i}>
                <path d={c.d} strokeWidth={0.9} {...line} className="orn-stroke-light orn-draw" opacity={0.85} />
                {c.pts.map((p, j) => (
                  <circle key={j} cx={p.x} cy={p.y} r={j === 0 ? 4.2 : 2.8} className="orn-fill-light" />
                ))}
              </g>
            ))}
            <circle r={326} strokeWidth={1.4} strokeDasharray="0.1 9" className="orn-stroke" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </RingLayer>

          {/* 4. Roman numerals */}
          <RingLayer ref={numeralsRef} ring="numerals" half={320} order={1}>
            <circle r={314} strokeWidth={1} {...line} />
            <circle r={268} strokeWidth={1} {...line} />
            <path d={dividers(268, 314)} strokeWidth={1} {...line} />
            <g className="orn-fill-light orn-wheel-text" fontSize={21} letterSpacing={1.5} style={{ fontFamily: 'var(--font-serif)' }}>
              {ROMAN.map((n, i) => (
                <text key={n} transform={`rotate(${segCenter(i)}) translate(0,-291)`} textAnchor="middle" dominantBaseline="middle">
                  {n}
                </text>
              ))}
            </g>
          </RingLayer>

          {/* 5. zodiac glyphs (paths, not Unicode) */}
          <RingLayer ref={glyphsRef} ring="glyphs" half={264} order={2}>
            <circle r={260} strokeWidth={1} {...line} />
            <circle r={190} strokeWidth={1} {...line} />
            <path d={dividers(190, 260)} strokeWidth={1} {...line} />
            {ZODIAC_GLYPHS.map((g, i) => {
              const p = at(225, segCenter(i));
              return (
                <path
                  key={g.name}
                  d={g.d}
                  transform={`translate(${f(p.x)},${f(p.y)}) scale(2.4) translate(-10,-10)`}
                  className="orn-stroke-light orn-draw"
                  pathLength={1}
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </RingLayer>

          {/* 6. inner ornamental band */}
          <RingLayer ref={innerRef} ring="inner" half={188} order={3}>
            <circle r={184} strokeWidth={1} {...line} />
            <path d={ticks} strokeWidth={0.8} {...line} />
            <path d={dividers(146, 184)} strokeWidth={1} {...line} />
            <circle r={178} strokeWidth={1.3} strokeDasharray="0.1 7" className="orn-stroke" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle r={146} strokeWidth={1} {...line} />
          </RingLayer>

          {/* 7. center moon: no rotation, breathing glow */}
          <div className="orn-ring-layer orn-moon" data-ring="moon" style={{ width: '26%', height: '26%', left: '37%', top: '37%', ['--ring-order' as string]: 4 }}>
            <span className="orn-moon-glow" />
            <svg viewBox="-130 -130 260 260" className="relative w-full h-full overflow-visible">
              <defs>
                <mask id={`${id}-crescent`}>
                  <circle r={66} fill="#fff" />
                  <circle cx={28} cy={-18} r={56} fill="#000" />
                </mask>
              </defs>
              <circle r={66} className="orn-fill-light" mask={`url(#${id}-crescent)`} />
              <path d={fourStar(34, -30, 13)} className="orn-fill-light" />
              <path d={fourStar(52, 2, 8)} className="orn-fill-light" />
              <path d={fourStar(20, 10, 6)} className="orn-fill-light" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
