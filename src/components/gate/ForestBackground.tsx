import React, { useId, useMemo } from 'react';
import { flowerPath, leafPath, seeded, stop } from './sceneUtils';

/*
 * Enchanted forest behind the gate, split into independent depth layers
 * (sky, sun rays, far trees, mid trees, foreground left/right) so each can
 * get its own parallax/animation later. Wide layers use a 1440×900 viewBox
 * with "slice" so they always cover the page, anchored to the bottom.
 */

const W = 1440;
const H = 900;
const layerClass = 'absolute inset-0 w-full h-full pointer-events-none';

export const SkyLayer: React.FC = () => {
  const id = useId();
  return (
    <svg data-part="sky" className={layerClass} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('sky-top')} />
          <stop offset="1" style={stop('sky-bottom')} />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.2" cy="0" r="0.6">
          <stop offset="0" style={stop('sun', 1)} />
          <stop offset="0.4" style={stop('sun', 0.55)} />
          <stop offset="1" style={stop('sun', 0)} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <rect width={W} height={H} fill={`url(#${id}-sun)`} />
    </svg>
  );
};

export const SunRays: React.FC = () => {
  const id = useId();
  const rays = [
    { a: 180, b: 330, w: 70 },
    { a: 420, b: 640, w: 110 },
    { a: 700, b: 980, w: 80 },
    { a: 1000, b: 1320, w: 130 },
    { a: 1320, b: 1640, w: 90 },
  ];
  return (
    <svg data-part="sun-rays" className={layerClass} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" style={stop('sunray', 0.75)} />
          <stop offset="0.55" style={stop('sunray', 0.3)} />
          <stop offset="1" style={stop('sunray', 0)} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-ray)`}>
        {rays.map((r, i) => (
          <polygon key={i} data-part={`sun-ray-${i}`} points={`200,-80 ${230 + i * 10},-80 ${r.b + r.w},${H} ${r.b},${H}`} opacity={0.55 + (i % 2) * 0.2} />
        ))}
      </g>
    </svg>
  );
};

function crown(rand: () => number, cx: number, cy: number, r: number) {
  const blobs: { x: number; y: number; r: number }[] = [{ x: cx, y: cy, r }];
  const n = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.6;
    blobs.push({
      x: cx + Math.cos(a) * r * (0.55 + rand() * 0.25),
      y: cy + Math.sin(a) * r * 0.5 + r * 0.1,
      r: r * (0.55 + rand() * 0.25),
    });
  }
  return blobs;
}

export const FarTrees: React.FC = () => {
  const id = useId();
  const trees = useMemo(() => {
    const rand = seeded(11);
    const out: { x: number; y: number; r: number; trunk: number; tone: number; blobs: ReturnType<typeof crown> }[] = [];
    for (let x = -30; x < W + 60; x += 48 + rand() * 30) {
      const r = 38 + rand() * 30;
      const y = 470 + rand() * 70;
      out.push({ x, y, r, trunk: 160, tone: rand() < 0.5 ? 1 : 2, blobs: crown(rand, x, y, r) });
    }
    return out;
  }, []);
  return (
    <svg data-part="far-trees" className={layerClass} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('mist', 0)} />
          <stop offset="1" style={stop('mist', 0.85)} />
        </linearGradient>
      </defs>
      {trees.map((t, i) => (
        <g key={i} className={t.tone === 1 ? 'fill-scene-far-1' : 'fill-scene-far-2'}>
          <rect x={t.x - 3} y={t.y} width={6} height={t.trunk} />
          {t.blobs.map((b, j) => (
            <circle key={j} cx={b.x} cy={b.y} r={b.r} />
          ))}
        </g>
      ))}
      <rect y={590} width={W} height={H - 590} className="fill-scene-far-2" />
      <rect y={420} width={W} height={H - 420} fill={`url(#${id}-mist)`} />
    </svg>
  );
};

export const MidTrees: React.FC = () => {
  const id = useId();
  const trees = useMemo(() => {
    const rand = seeded(29);
    const xs = [-10, 120, 250, 370, 1070, 1190, 1320, 1450];
    return xs.map((x) => {
      const r = 70 + rand() * 40;
      const top = 250 + rand() * 90;
      return { x, r, top, lean: (rand() - 0.5) * 30, blobs: crown(rand, x, top, r), hi: crown(rand, x - r * 0.25, top - r * 0.25, r * 0.45) };
    });
  }, []);
  return (
    <svg data-part="mid-trees" className={layerClass} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('ground')} />
          <stop offset="1" style={stop('ground-dark')} />
        </linearGradient>
      </defs>
      {trees.map((t, i) => (
        <g key={i} data-part={`mid-tree-${i}`}>
          <path
            className="fill-scene-trunk"
            d={`M${t.x - 16},${H - 120} C${t.x - 10},${t.top + 200} ${t.x - 8 + t.lean},${t.top + 80} ${t.x - 5 + t.lean},${t.top + 20}
               L${t.x + 5 + t.lean},${t.top + 20} C${t.x + 8 + t.lean},${t.top + 80} ${t.x + 10},${t.top + 200} ${t.x + 16},${H - 120} Z`}
          />
          <path className="stroke-scene-trunk" strokeWidth={6} strokeLinecap="round" fill="none" d={`M${t.x + t.lean * 0.5},${t.top + 120} q${t.r * 0.4},-30 ${t.r * 0.6},-70`} />
          <path className="stroke-scene-trunk-dark" strokeWidth={2} fill="none" opacity={0.5} d={`M${t.x + 4},${H - 130} C${t.x + 5},${t.top + 220} ${t.x + 3 + t.lean},${t.top + 90} ${t.x + 2 + t.lean},${t.top + 40}`} />
          <g className={i % 2 ? 'fill-scene-mid-2' : 'fill-scene-mid-3'}>
            {t.blobs.map((b, j) => (
              <circle key={j} cx={b.x + t.lean} cy={b.y} r={b.r} />
            ))}
          </g>
          <g className="fill-scene-mid-1" opacity={0.9}>
            {t.hi.map((b, j) => (
              <circle key={j} cx={b.x + t.lean} cy={b.y} r={b.r} />
            ))}
          </g>
        </g>
      ))}
      <path
        data-part="ground"
        fill={`url(#${id}-ground)`}
        d={`M0,${H - 150} C240,${H - 190} 460,${H - 130} 720,${H - 150} C980,${H - 170} 1200,${H - 125} ${W},${H - 160} L${W},${H} L0,${H} Z`}
      />
    </svg>
  );
};

/* ── Foreground: ferns, mushrooms, flowers (one corner) ──────────── */

function Fern({ x, y, len, bend, angle, tone }: { x: number; y: number; len: number; bend: number; angle: number; tone: 'fern' | 'fern-dark' }) {
  // stem as a quadratic curve; leaflets along it shrinking toward the tip
  const a = (angle * Math.PI) / 180;
  const tip = { x: x + Math.cos(a) * len, y: y + Math.sin(a) * len };
  const ctrl = { x: (x + tip.x) / 2 + bend, y: (y + tip.y) / 2 - Math.abs(bend) * 0.4 };
  const leaflets: React.ReactNode[] = [];
  const steps = 13;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = (1 - t) ** 2 * x + 2 * (1 - t) * t * ctrl.x + t * t * tip.x;
    const py = (1 - t) ** 2 * y + 2 * (1 - t) * t * ctrl.y + t * t * tip.y;
    const dx = 2 * (1 - t) * (ctrl.x - x) + 2 * t * (tip.x - ctrl.x);
    const dy = 2 * (1 - t) * (ctrl.y - y) + 2 * t * (tip.y - ctrl.y);
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const size = len * 0.2 * (1 - t * 0.75);
    for (const side of [-1, 1]) {
      leaflets.push(
        <path key={`${i}${side}`} d={leafPath(size)} transform={`translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${(deg + 90 + side * 55).toFixed(1)}) translate(0,${(-size / 2).toFixed(1)})`} />
      );
    }
  }
  return (
    <g className={tone === 'fern' ? 'fill-scene-fern stroke-scene-fern' : 'fill-scene-fern-dark stroke-scene-fern-dark'}>
      <path d={`M${x},${y} Q${ctrl.x},${ctrl.y} ${tip.x},${tip.y}`} fill="none" strokeWidth={2.2} strokeLinecap="round" />
      <g stroke="none">{leaflets}</g>
    </g>
  );
}

function Mushroom({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path className="fill-scene-mushroom-stem" d="M-7,0 C-8,-14 -6,-26 -5,-30 L5,-30 C6,-26 8,-14 7,0 Z" />
      <path className="fill-scene-mushroom" d="M-26,-28 C-24,-50 24,-50 26,-28 C16,-24 -16,-24 -26,-28 Z" />
      <path className="fill-scene-mushroom-dark" opacity={0.5} d="M-26,-28 C-16,-24 16,-24 26,-28 C20,-25 -20,-25 -26,-28 Z" />
      <g className="fill-scene-mushroom-spot">
        <circle cx={-12} cy={-37} r={3.2} />
        <circle cx={4} cy={-42} r={2.6} />
        <circle cx={14} cy={-33} r={2.2} />
        <circle cx={-3} cy={-33} r={1.8} />
      </g>
    </g>
  );
}

function Daisy({ x, y, r, tone }: { x: number; y: number; r: number; tone: 'white' | 'butter' | 'lavender' }) {
  const cls = tone === 'white' ? 'fill-scene-bloom-white' : tone === 'butter' ? 'fill-scene-bloom-butter' : 'fill-scene-bloom-lavender';
  return (
    <g transform={`translate(${x},${y})`}>
      <path className="stroke-scene-ivy-dark" strokeWidth={1.4} fill="none" d={`M0,0 q${r * 0.4},${r * 2} 0,${r * 4}`} />
      <path className={cls} d={flowerPath(r, 6)} />
      <circle className="fill-scene-bloom-center" r={r * 0.3} />
    </g>
  );
}

function Bluebell({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path className="stroke-scene-ivy-dark" strokeWidth={1.5} fill="none" d={`M0,0 C2,${-h * 0.5} ${h * 0.2},${-h * 0.9} ${h * 0.35},${-h}`} />
      {[0.35, 0.6, 0.85].map((t, i) => {
        const bx = h * 0.35 * t * t + 2;
        const by = -h * t;
        return <path key={i} className="fill-scene-bloom-lavender" d={`M${bx},${by} c-5,1 -6,8 -5,11 l2,-2 1,3 2,-3 2,3 1,-3 2,2 c1,-3 0,-10 -5,-11 z`} />;
      })}
    </g>
  );
}

export const ForegroundCorner: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const id = useId();
  const tufts = useMemo(() => {
    const rand = seeded(side === 'left' ? 5 : 8);
    return Array.from({ length: 14 }, () => ({ x: rand() * 500, h: 18 + rand() * 26, lean: (rand() - 0.5) * 16 }));
  }, [side]);
  const variant = side === 'left';
  return (
    <svg
      data-part={`foreground-${side}`}
      className={`absolute bottom-0 ${side === 'left' ? 'left-0' : 'right-0 -scale-x-100'} w-[min(46vw,520px)] h-auto pointer-events-none`}
      viewBox="0 0 520 420"
      preserveAspectRatio="xMinYMax meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-mound`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('near-1')} />
          <stop offset="1" style={stop('near-2')} />
        </linearGradient>
      </defs>
      <Fern x={60} y={400} len={230} bend={-40} angle={-78} tone="fern-dark" />
      <Fern x={30} y={410} len={200} bend={50} angle={-55} tone="fern" />
      <Fern x={110} y={410} len={170} bend={-30} angle={-40} tone="fern" />
      {variant && <Fern x={200} y={415} len={140} bend={20} angle={-100} tone="fern-dark" />}
      <path fill={`url(#${id}-mound)`} d="M0,340 C90,318 190,330 280,360 C360,385 440,392 520,420 L0,420 Z" />
      <g className="fill-scene-near-1">
        {tufts.map((t, i) => (
          <path key={i} d={`M${t.x},420 q${t.lean * 0.3},${-t.h * 0.6} ${t.lean},${-t.h} q${-t.lean * 0.1},${t.h * 0.6} 4,${t.h} z`} />
        ))}
      </g>
      <Mushroom x={variant ? 170 : 150} y={392} s={1.15} />
      <Mushroom x={variant ? 215 : 205} y={400} s={0.75} />
      {!variant && <Mushroom x={95} y={404} s={0.6} />}
      <Bluebell x={variant ? 270 : 250} y={404} h={70} />
      <Bluebell x={variant ? 300 : 290} y={410} h={52} />
      <Daisy x={variant ? 245 : 330} y={372} r={9} tone="white" />
      <Daisy x={variant ? 330 : 360} y={388} r={7} tone="butter" />
      <Daisy x={variant ? 120 : 60} y={372} r={8} tone="white" />
      <Daisy x={variant ? 360 : 225} y={396} r={6} tone="lavender" />
      <Daisy x={variant ? 40 : 400} y={380} r={6.5} tone="butter" />
    </svg>
  );
};

export const ForestBackground: React.FC = () => (
  <div data-part="forest" className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <SkyLayer />
    <FarTrees />
    <MidTrees />
    <SunRays />
  </div>
);
