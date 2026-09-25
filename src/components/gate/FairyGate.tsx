import React, { useId, useMemo } from 'react';
import { flowerPath, ivyPath, leafPath, polar, seeded, stop } from './sceneUtils';

/*
 * Stone gate of the fairy forest. Coordinates use a 600×820 gate space.
 * Parts are separate elements for later animation:
 *   GateInterior (light behind the doors) → DoorLeaf ×2 + DoorSeamLight
 *   → GateArch (stones, steps, carved title) → GateFoliage → Butterfly ×3
 */

export const GATE_W = 600;
export const GATE_H = 820;
const CX = 300;
const CY = 310;

// Door opening (doors are drawn slightly larger than the stone hole so the
// frame overlaps their edges).
const DOOR = { x: 110, y: 120, w: 380, h: 670 };
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/* ── Light behind the doors (revealed when they open) ───────────────── */

export const GateInterior: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => {
  const id = useId();
  return (
    <svg data-part="gate-interior" className={className} style={style} viewBox={`0 0 ${DOOR.w} ${DOOR.h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.55" r="0.7">
          <stop offset="0" style={stop('interior')} />
          <stop offset="0.6" style={stop('gilt-light')} />
          <stop offset="1" style={stop('gilt')} />
        </radialGradient>
      </defs>
      <path d="M0,670 V190 A190,190 0 0 1 380,190 V670 Z" fill={`url(#${id}-glow)`} />
    </svg>
  );
};

/* ── Door leaves ───────────────────────────────────────────────────── */

const LEAF_SHAPE = 'M0,670 V190 A190,190 0 0 1 190,0 V670 Z';

function hingePath(y: number) {
  return `M0,${y - 10} H64 C78,${y - 10} 88,${y - 4} 98,${y} C88,${y + 4} 78,${y + 10} 64,${y + 10} H0 Z`;
}

export const DoorLeaf: React.FC<{ side: 'left' | 'right'; className?: string }> = ({ side, className = '' }) => {
  const id = useId();
  const { grain, vineLeaves } = useMemo(() => {
    const rand = seeded(side === 'left' ? 3 : 4);
    const grain: string[] = [];
    for (let p = 0; p < 5; p++) {
      for (let k = 0; k < 3; k++) {
        const x0 = p * 38 + 6 + rand() * 26;
        let d = `M${x0.toFixed(1)},0`;
        for (let y = 40; y <= 680; y += 40) d += ` Q${(x0 + (rand() - 0.5) * 6).toFixed(1)},${y - 20} ${(x0 + (rand() - 0.5) * 3).toFixed(1)},${y}`;
        grain.push(d);
      }
    }
    // carved vine along the outer edge: straight part then around the arch
    const vineLeaves: { x: number; y: number; r: number }[] = [];
    let flip = 1;
    for (let y = 640; y >= 200; y -= 30) {
      vineLeaves.push({ x: 9, y, r: -flip * 40 });
      flip = -flip;
    }
    for (let a = 184; a <= 262; a += 8) {
      const p = polar(190, 190, 181, a);
      vineLeaves.push({ x: p.x, y: p.y, r: a - 180 - flip * 40 });
      flip = -flip;
    }
    return { grain, vineLeaves };
  }, [side]);

  const content = (
    <>
      <path d={LEAF_SHAPE} fill={`url(#${id}-wood)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* planks + grain */}
        <g className="stroke-scene-wood-dark" fill="none" strokeWidth={0.8} opacity={0.28}>
          {grain.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {[38, 76, 114, 152].map((x) => (
          <g key={x}>
            <line x1={x} y1={0} x2={x} y2={670} className="stroke-scene-wood-deep" strokeWidth={1.6} opacity={0.45} />
            <line x1={x + 1.6} y1={0} x2={x + 1.6} y2={670} className="stroke-scene-wood-light" strokeWidth={0.8} opacity={0.45} />
          </g>
        ))}
        {/* carved inner panel */}
        <path d="M20,642 V190 A170,170 0 0 1 176,22.6 V642 Z" fill="none" className="stroke-scene-wood-light" strokeWidth={1.4} opacity={0.5} transform="translate(1.4,1.4)" />
        <path d="M20,642 V190 A170,170 0 0 1 176,22.6 V642 Z" fill="none" className="stroke-scene-wood-deep" strokeWidth={2.6} opacity={0.6} />
        {[330, 505].map((y) => (
          <g key={y}>
            <line x1={20} y1={y} x2={176} y2={y} className="stroke-scene-wood-deep" strokeWidth={2.2} opacity={0.55} />
            <line x1={20} y1={y + 2} x2={176} y2={y + 2} className="stroke-scene-wood-light" strokeWidth={1} opacity={0.45} />
          </g>
        ))}
        {/* carved flower medallion */}
        <g transform="translate(98,418)">
          <circle r={24} fill="none" className="stroke-scene-wood-deep" strokeWidth={1.8} opacity={0.55} />
          <path d={flowerPath(17, 6)} className="fill-scene-wood-dark stroke-scene-wood-deep" strokeWidth={1} opacity={0.75} />
          <circle r={4} className="fill-scene-wood-deep" opacity={0.6} />
        </g>
        {/* carved leaf vine on the outer edge */}
        <path d="M9,660 V190 A181,181 0 0 1 176,9.5" fill="none" className="stroke-scene-wood-deep" strokeWidth={1.4} opacity={0.6} />
        <g className="fill-scene-wood-dark stroke-scene-wood-deep" strokeWidth={0.8} opacity={0.85}>
          {vineLeaves.map((l, i) => (
            <path key={i} d={leafPath(13)} transform={`translate(${l.x.toFixed(1)},${l.y.toFixed(1)}) rotate(${l.r}) translate(0,-6)`} />
          ))}
        </g>
        {/* seam-side shadow */}
        <rect x={172} y={0} width={18} height={670} fill={`url(#${id}-seam)`} />
      </g>
      <path d={LEAF_SHAPE} fill="none" className="stroke-scene-wood-deep" strokeWidth={3} />
      {/* gold hinges */}
      {[250, 560].map((y) => (
        <g key={y} data-part="hinge">
          <path d={hingePath(y)} fill={`url(#${id}-gilt)`} className="stroke-scene-gilt-deep" strokeWidth={1} />
          <path d={`M92,${y} c6,-6 12,-4 12,1 c0,4 -5,5 -7,2`} fill="none" className="stroke-scene-gilt-deep" strokeWidth={1.6} strokeLinecap="round" />
          {[14, 34, 54].map((x) => (
            <g key={x}>
              <circle cx={x} cy={y} r={2.8} className="fill-scene-gilt-deep" />
              <circle cx={x - 0.8} cy={y - 0.8} r={1} className="fill-scene-gilt-light" />
            </g>
          ))}
        </g>
      ))}
      {/* ring handle near the seam */}
      <g data-part="handle" transform="translate(160,420)">
        <path d={flowerPath(13, 6)} fill={`url(#${id}-gilt)`} className="stroke-scene-gilt-deep" strokeWidth={1} />
        <circle r={3.4} className="fill-scene-gilt-deep" />
        <circle cy={24} r={14} fill="none" className="stroke-scene-gilt-deep" strokeWidth={5} />
        <circle cy={24} r={14} fill="none" className="stroke-scene-gilt" strokeWidth={3} />
        <path d="M-9,14 A14,14 0 0 1 6,11" fill="none" className="stroke-scene-gilt-light" strokeWidth={1.2} strokeLinecap="round" transform="translate(0,2)" />
      </g>
    </>
  );

  return (
    <svg data-part={`door-${side}`} className={className} viewBox="0 0 190 670" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={LEAF_SHAPE} />
        </clipPath>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={stop('wood-dark')} />
          <stop offset="0.35" style={stop('wood')} />
          <stop offset="0.65" style={stop('wood-light')} />
          <stop offset="1" style={stop('wood')} />
        </linearGradient>
        <linearGradient id={`${id}-seam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={stop('wood-deep', 0)} />
          <stop offset="1" style={stop('wood-deep', 0.55)} />
        </linearGradient>
        <linearGradient id={`${id}-gilt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('gilt-light')} />
          <stop offset="0.5" style={stop('gilt')} />
          <stop offset="1" style={stop('gilt-deep')} />
        </linearGradient>
      </defs>
      {side === 'left' ? content : <g transform="translate(190,0) scale(-1,1)">{content}</g>}
    </svg>
  );
};

/** Thin line of light between the closed doors. */
export const DoorSeamLight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    data-part="door-seam"
    className={className}
    style={{
      background: 'linear-gradient(180deg, transparent 0%, var(--c-scene-seam) 10%, var(--c-scene-interior) 50%, var(--c-scene-seam) 90%, transparent 100%)',
      boxShadow: '0 0 8px 2px color-mix(in srgb, var(--c-scene-seam) 70%, transparent), 0 0 22px 6px color-mix(in srgb, var(--c-scene-gilt-light) 40%, transparent)',
    }}
    aria-hidden="true"
  />
);

/* ── Stone arch ────────────────────────────────────────────────────── */

const OUTER = 'M8,792 V310 A292,292 0 0 1 592,310 V792 Z';
const INNER = 'M116,792 V310 A184,184 0 0 1 484,310 V792 Z';

export const GateArch: React.FC<{ className?: string; title?: string }> = ({ className = '', title = 'Uyên Thư Các' }) => {
  const id = useId();
  const speckles = useMemo(() => {
    const rand = seeded(17);
    return Array.from({ length: 140 }, () => ({ x: rand() * 600, y: rand() * 800, r: 0.6 + rand() * 1.6, o: 0.15 + rand() * 0.25 }));
  }, []);

  const radial = (r1: number, r2: number, from: number, to: number, step: number) => {
    const lines: string[] = [];
    for (let a = from + step; a < to - 0.1; a += step) {
      const p1 = polar(CX, CY, r1, a);
      const p2 = polar(CX, CY, r2, a);
      lines.push(`M${p1.x.toFixed(1)},${p1.y.toFixed(1)} L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
    }
    return lines.join(' ');
  };

  const pillarJoints = (x0: number, x1: number) => {
    let d = '';
    let row = 0;
    for (let y = 370; y < 792; y += 58) {
      d += `M${x0},${y} H${x1} `;
      const vx = row % 2 ? x0 + (x1 - x0) * 0.35 : x0 + (x1 - x0) * 0.65;
      d += `M${vx.toFixed(1)},${y} V${Math.min(y + 58, 792)} `;
      row++;
    }
    return d;
  };

  const ks = [polar(CX, CY, 184, 262), polar(CX, CY, 216, 260), polar(CX, CY, 216, 280), polar(CX, CY, 184, 278)];

  return (
    <svg data-part="gate-arch" className={className} viewBox={`0 0 ${GATE_W} ${GATE_H}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={stop('stone-light')} />
          <stop offset="0.55" style={stop('stone')} />
          <stop offset="1" style={stop('stone-dark')} />
        </linearGradient>
        <linearGradient id={`${id}-step`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('stone-light')} />
          <stop offset="1" style={stop('stone-dark')} />
        </linearGradient>
        <clipPath id={`${id}-frame`}>
          <path d={`${OUTER} ${INNER}`} clipRule="evenodd" />
        </clipPath>
        <path id={`${id}-title-path`} d="M72,310 A228,228 0 0 1 528,310" />
        <filter id={`${id}-glow`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* frame */}
      <path d={`${OUTER} ${INNER}`} fillRule="evenodd" fill={`url(#${id}-stone)`} />
      <g clipPath={`url(#${id}-frame)`}>
        <g className="fill-scene-stone-shadow">
          {speckles.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
          ))}
        </g>
        <g fill="none" className="stroke-scene-stone-shadow" strokeWidth={1.6} opacity={0.7}>
          <path d={radial(184, 207, 180, 360, 10)} />
          <path d={radial(262, 292, 180, 360, 12)} />
          <path d={`M${CX - 207},${CY} A207,207 0 0 1 ${CX + 207},${CY}`} />
          <path d={`M${CX - 262},${CY} A262,262 0 0 1 ${CX + 262},${CY}`} />
          <path d={pillarJoints(8, 116)} />
          <path d={pillarJoints(484, 592)} />
        </g>
        <g fill="none" className="stroke-scene-stone-light" strokeWidth={1} opacity={0.8} transform="translate(1.2,1.2)">
          <path d={`M${CX - 207},${CY} A207,207 0 0 1 ${CX + 207},${CY}`} />
          <path d={`M${CX - 262},${CY} A262,262 0 0 1 ${CX + 262},${CY}`} />
        </g>
      </g>
      {/* depth on the inner edge + outline */}
      <path d={INNER} fill="none" className="stroke-scene-stone-shadow" strokeWidth={5} opacity={0.55} />
      <path d={OUTER} fill="none" className="stroke-scene-stone-shadow" strokeWidth={2} opacity={0.6} />

      {/* imposts */}
      {[0, 472].map((x) => (
        <g key={x}>
          <rect x={x} y={296} width={128} height={24} rx={3} fill={`url(#${id}-step)`} className="stroke-scene-stone-shadow" strokeWidth={1.2} />
          <line x1={x + 4} y1={303} x2={x + 124} y2={303} className="stroke-scene-stone-shadow" strokeWidth={1} opacity={0.6} />
        </g>
      ))}

      {/* keystone with carved flower */}
      <path d={`M${ks[0].x},${ks[0].y} L${ks[1].x},${ks[1].y} L${ks[2].x},${ks[2].y} L${ks[3].x},${ks[3].y} Z`} fill={`url(#${id}-step)`} className="stroke-scene-stone-shadow" strokeWidth={1.2} />
      <path d={flowerPath(8, 5)} transform={`translate(${CX},${CY - 199})`} fill="none" className="stroke-scene-stone-shadow" strokeWidth={1.2} />

      {/* steps */}
      <rect x={24} y={786} width={552} height={18} rx={3} fill={`url(#${id}-step)`} className="stroke-scene-stone-shadow" strokeWidth={1.2} />
      <rect x={0} y={802} width={600} height={18} rx={3} fill={`url(#${id}-step)`} className="stroke-scene-stone-shadow" strokeWidth={1.2} />

      {/* carved title with soft gold glow */}
      <g data-part="gate-title" style={{ fontFamily: 'var(--font-serif)' }} fontSize={36} fontWeight={700} letterSpacing={3}>
        <text className="fill-scene-stone-light" transform="translate(0,1.6)">
          <textPath href={`#${id}-title-path`} startOffset="50%" textAnchor="middle">
            {title}
          </textPath>
        </text>
        <text className="fill-scene-stone-shadow" transform="translate(0,-1)">
          <textPath href={`#${id}-title-path`} startOffset="50%" textAnchor="middle">
            {title}
          </textPath>
        </text>
        <text className="fill-scene-gilt" filter={`url(#${id}-glow)`}>
          <textPath href={`#${id}-title-path`} startOffset="50%" textAnchor="middle">
            {title}
          </textPath>
        </text>
      </g>
    </svg>
  );
};

/* ── Ivy, wisteria, roses and little flowers ───────────────────────── */

function Rose({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} className="fill-scene-rose" />
      <path
        d={`M${-r * 0.1},${-r * 0.15} a${r * 0.2},${r * 0.2} 0 1 1 ${r * 0.35},${r * 0.2} a${r * 0.45},${r * 0.45} 0 1 1 ${-r * 0.75},${-r * 0.1} a${r * 0.7},${r * 0.7} 0 1 1 ${r * 1.2},${r * 0.3}`}
        fill="none"
        className="stroke-scene-rose-deep"
        strokeWidth={r * 0.14}
        strokeLinecap="round"
      />
      <path d={`M${-r * 0.7},${-r * 0.35} a${r * 0.8},${r * 0.8} 0 0 1 ${r * 0.6},${-r * 0.45}`} fill="none" className="stroke-scene-rose-light" strokeWidth={r * 0.14} strokeLinecap="round" />
    </g>
  );
}

function Wisteria({ x, y, len, seed }: { x: number; y: number; len: number; seed: number }) {
  const blossoms = useMemo(() => {
    const rand = seeded(seed);
    const out: { x: number; y: number; r: number; tone: number }[] = [];
    for (let t = 0; t <= 1; t += 0.045) {
      const width = 13 * (1 - t) + 2.5;
      const n = Math.max(1, Math.round(3 * (1 - t)) + 1);
      for (let k = 0; k < n; k++) {
        out.push({
          x: (rand() - 0.5) * width * 2 + Math.sin(t * 3) * 3,
          y: t * len + (rand() - 0.5) * 4,
          r: 4.8 - t * 2.2 + rand() * 0.8,
          tone: t < 0.35 ? 0 : t < 0.7 ? 1 : 2,
        });
      }
    }
    return out;
  }, [len, seed]);
  const cls = ['fill-scene-wisteria-deep', 'fill-scene-wisteria', 'fill-scene-wisteria-light'];
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={`M0,-4 Q3,${len * 0.4} ${Math.sin(3) * 3},${len}`} fill="none" className="stroke-scene-ivy-dark" strokeWidth={1.2} />
      {blossoms.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} className={cls[b.tone]} />
      ))}
      <path d={leafPath(16)} className="fill-scene-ivy" transform="translate(-8,-2) rotate(-60)" />
      <path d={leafPath(14)} className="fill-scene-ivy-dark" transform="translate(8,-1) rotate(55)" />
    </g>
  );
}

export const GateFoliage: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ivy = useMemo(() => {
    const rand = seeded(41);
    const leaves: { x: number; y: number; s: number; r: number; tone: number }[] = [];
    // around the outer arch
    for (let a = 186; a <= 354; a += 5 + rand() * 4) {
      const p = polar(CX, CY, 286 + (rand() - 0.5) * 14, a);
      leaves.push({ x: p.x, y: p.y, s: 15 + rand() * 9, r: a + 90 + (rand() - 0.5) * 70, tone: Math.floor(rand() * 3) });
    }
    // down the left pillar
    for (let y = 320; y < 720; y += 14 + rand() * 12) {
      leaves.push({ x: 12 + Math.sin(y / 40) * 8 + rand() * 6, y, s: 14 + rand() * 9, r: (rand() - 0.5) * 120, tone: Math.floor(rand() * 3) });
    }
    // part of the right pillar
    for (let y = 320; y < 520; y += 16 + rand() * 12) {
      leaves.push({ x: 588 - Math.sin(y / 36) * 8 - rand() * 6, y, s: 13 + rand() * 8, r: (rand() - 0.5) * 120, tone: Math.floor(rand() * 3) });
    }
    // climbing from the ground on the right
    for (let y = 790; y > 640; y -= 13 + rand() * 10) {
      leaves.push({ x: 560 + Math.sin(y / 30) * 10 + rand() * 8, y, s: 14 + rand() * 7, r: (rand() - 0.5) * 120, tone: Math.floor(rand() * 3) });
    }
    const flowers: { x: number; y: number; r: number; tone: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const l = leaves[Math.floor(rand() * leaves.length)];
      flowers.push({ x: l.x + (rand() - 0.5) * 14, y: l.y + (rand() - 0.5) * 14, r: 3.2 + rand() * 1.8, tone: rand() < 0.6 ? 0 : 1 });
    }
    return { leaves, flowers };
  }, []);

  const archVine = (() => {
    let d = '';
    for (let a = 184; a <= 356; a += 4) {
      const p = polar(CX, CY, 286 + Math.sin(a / 5) * 5, a);
      d += `${a === 184 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
    }
    return d;
  })();

  const leafCls = ['fill-scene-ivy', 'fill-scene-ivy-dark', 'fill-scene-ivy-light'];
  const wisteria = [
    { a: 204, len: 104, seed: 1 },
    { a: 219, len: 78, seed: 2 },
    { a: 236, len: 60, seed: 3 },
    { a: 304, len: 64, seed: 4 },
    { a: 321, len: 84, seed: 5 },
    { a: 337, len: 110, seed: 6 },
  ];

  return (
    <svg data-part="gate-foliage" className={className} viewBox={`0 0 ${GATE_W} ${GATE_H}`} overflow="visible" aria-hidden="true">
      <g data-part="ivy">
        <path d={archVine} fill="none" className="stroke-scene-ivy-dark" strokeWidth={2} />
        <path d="M14,320 C4,420 26,500 10,600 C0,660 20,700 16,730" fill="none" className="stroke-scene-ivy-dark" strokeWidth={2} />
        <path d="M588,320 C598,390 576,450 590,520" fill="none" className="stroke-scene-ivy-dark" strokeWidth={2} />
        <path d="M566,800 C550,760 578,720 560,650" fill="none" className="stroke-scene-ivy-dark" strokeWidth={2} />
        {ivy.leaves.map((l, i) => (
          <path key={i} d={ivyPath(l.s)} className={leafCls[l.tone]} transform={`translate(${l.x.toFixed(1)},${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)})`} />
        ))}
        {ivy.flowers.map((f, i) => (
          <g key={i} transform={`translate(${f.x.toFixed(1)},${f.y.toFixed(1)})`}>
            <path d={flowerPath(f.r)} className={f.tone ? 'fill-scene-bloom-butter' : 'fill-scene-bloom-white'} />
            <circle r={f.r * 0.3} className="fill-scene-bloom-center" />
          </g>
        ))}
      </g>

      <g data-part="wisteria">
        {wisteria.map((w, i) => {
          const p = polar(CX, CY, 190, w.a);
          return <Wisteria key={i} x={p.x} y={p.y} len={w.len} seed={w.seed} />;
        })}
      </g>

      <g data-part="roses">
        {[
          { x: 40, y: 250, s: 1 },
          { x: 560, y: 250, s: 1 },
          { x: 70, y: 294, s: 0.8 },
          { x: 530, y: 294, s: 0.8 },
          { x: 190, y: 44, s: 0.75 },
          { x: 410, y: 44, s: 0.75 },
        ].map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.s})`}>
            <path d={leafPath(22)} className="fill-scene-ivy-dark" transform="translate(-16,6) rotate(-70)" />
            <path d={leafPath(20)} className="fill-scene-ivy" transform="translate(16,8) rotate(70)" />
            <Rose x={-9} y={2} r={11} />
            <Rose x={10} y={-3} r={9.5} />
            <Rose x={1} y={12} r={8} />
          </g>
        ))}
      </g>
    </svg>
  );
};

/* ── Butterflies resting on the gate ───────────────────────────────── */

export const Butterfly: React.FC<{ tone: 'wisteria' | 'gilt' | 'rose'; className?: string; style?: React.CSSProperties }> = ({ tone, className = '', style }) => {
  const wing = { wisteria: 'fill-scene-wisteria', gilt: 'fill-scene-gilt-light', rose: 'fill-scene-rose' }[tone];
  const edge = { wisteria: 'stroke-scene-wisteria-deep', gilt: 'stroke-scene-gilt-deep', rose: 'stroke-scene-rose-deep' }[tone];
  const upper = 'M0,-2 C-6,-14 -20,-16 -19,-6 C-18,1 -8,2 0,0 Z';
  const lower = 'M0,0 C-7,2 -15,8 -11,13 C-7,17 -2,8 0,2 Z';
  return (
    <svg data-part="butterfly" className={className} style={style} viewBox="-22 -18 44 34" aria-hidden="true">
      <g className={`${wing} ${edge}`} strokeWidth={1}>
        <path d={upper} />
        <path d={lower} />
        <g transform="scale(-1,1)">
          <path d={upper} />
          <path d={lower} />
        </g>
      </g>
      <g className="fill-scene-bloom-white" opacity={0.8}>
        <circle cx={-12} cy={-7} r={2} />
        <circle cx={12} cy={-7} r={2} />
      </g>
      <path d="M0,-6 L0,10" className="stroke-scene-ink" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M0,-6 q-3,-6 -6,-8 M0,-6 q3,-6 6,-8" fill="none" className="stroke-scene-ink" strokeWidth={0.9} strokeLinecap="round" />
    </svg>
  );
};

/* ── Whole gate ────────────────────────────────────────────────────── */

export const FairyGate: React.FC<{ className?: string }> = ({ className = '' }) => {
  const doorBox: React.CSSProperties = {
    left: pct(DOOR.x, GATE_W),
    top: pct(DOOR.y, GATE_H),
    width: pct(DOOR.w, GATE_W),
    height: pct(DOOR.h, GATE_H),
  };
  return (
    <div data-part="gate" className={`relative ${className}`}>
      {/* soft shadow on the ground */}
      <div
        className="absolute -bottom-[2%] left-[2%] right-[2%] h-[7%] rounded-[50%] blur-md"
        style={{ background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--c-scene-trunk-dark) 45%, transparent), transparent 70%)' }}
        aria-hidden="true"
      />
      <GateInterior className="absolute" style={doorBox} />
      <div data-part="doors" className="absolute" style={{ ...doorBox, perspective: '1400px' }}>
        <DoorLeaf side="left" className="absolute left-0 top-0 w-1/2 h-full" />
        <DoorLeaf side="right" className="absolute right-0 top-0 w-1/2 h-full" />
        <DoorSeamLight className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2" />
      </div>
      <GateArch className="absolute inset-0 w-full h-full" />
      <GateFoliage className="absolute inset-0 w-full h-full" />
      <Butterfly tone="wisteria" className="absolute w-[7%] left-[1%] top-[47%] -rotate-12" />
      <Butterfly tone="gilt" className="absolute w-[6%] left-[84%] top-[23%] rotate-[24deg]" />
      <Butterfly tone="rose" className="absolute w-[5.5%] left-[60%] top-[1.5%] rotate-[8deg]" />
    </div>
  );
};
