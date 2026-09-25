/** Deterministic PRNG so generated foliage is identical on every render. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** CSS variable for a scene token, for SVG gradient stops. */
export const sv = (name: string) => `var(--c-scene-${name})`;
export const stop = (name: string, opacity?: number) => ({
  stopColor: sv(name),
  ...(opacity !== undefined ? { stopOpacity: opacity } : {}),
});

/** Point on a circle, angle in degrees (0° = right, 90° = down, SVG coords). */
export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Simple ivy / almond leaf pointing up, centered at origin, ~size tall. */
export function leafPath(size: number) {
  const h = size / 2;
  const w = size * 0.32;
  return `M0,${-h} C${w},${-h * 0.4} ${w},${h * 0.5} 0,${h} C${-w},${h * 0.5} ${-w},${-h * 0.4} 0,${-h} Z`;
}

/** Three-lobed ivy leaf, centered at origin. */
export function ivyPath(s: number) {
  return `M0,${s * 0.55} C${-s * 0.1},${s * 0.2} ${-s * 0.62},${s * 0.35} ${-s * 0.58},${-s * 0.05}
    C${-s * 0.55},${-s * 0.35} ${-s * 0.25},${-s * 0.3} ${-s * 0.18},${-s * 0.28}
    C${-s * 0.2},${-s * 0.6} ${s * 0.2},${-s * 0.6} ${s * 0.18},${-s * 0.28}
    C${s * 0.25},${-s * 0.3} ${s * 0.55},${-s * 0.35} ${s * 0.58},${-s * 0.05}
    C${s * 0.62},${s * 0.35} ${s * 0.1},${s * 0.2} 0,${s * 0.55} Z`;
}

/** Five-petal flower as one path, centered at origin. */
export function flowerPath(r: number, petals = 5) {
  let d = '';
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const b = a + Math.PI / petals;
    const p = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    const c1 = { x: Math.cos(a - 0.5) * r * 1.15, y: Math.sin(a - 0.5) * r * 1.15 };
    const c2 = { x: Math.cos(a + 0.5) * r * 1.15, y: Math.sin(a + 0.5) * r * 1.15 };
    const q = { x: Math.cos(b) * r * 0.25, y: Math.sin(b) * r * 0.25 };
    if (i === 0) d += `M${(Math.cos(a - Math.PI / petals) * r * 0.25).toFixed(2)},${(Math.sin(a - Math.PI / petals) * r * 0.25).toFixed(2)} `;
    d += `C${c1.x.toFixed(2)},${c1.y.toFixed(2)} ${p.x.toFixed(2)},${p.y.toFixed(2)} ${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    d += `C${p.x.toFixed(2)},${p.y.toFixed(2)} ${c2.x.toFixed(2)},${c2.y.toFixed(2)} ${q.x.toFixed(2)},${q.y.toFixed(2)} `;
  }
  return d + 'Z';
}
