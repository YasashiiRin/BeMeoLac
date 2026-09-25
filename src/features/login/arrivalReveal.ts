/*
 * Circle reveal of the destination page, transforms only.
 * The app's routes sit in two plain wrappers (see App.tsx). During the reveal
 * the outer one becomes a circle centered on (x, y) that scales from a point
 * to cover the viewport, while the inner one is counter-scaled around the
 * same point so the page itself stays still ("expand reveal" technique).
 */

const STEPS = 24;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export interface RevealTarget {
  outer: HTMLElement;
  inner: HTMLElement;
}

export function getRevealTarget(): RevealTarget | null {
  const outer = document.querySelector<HTMLElement>('[data-reveal="outer"]');
  const inner = document.querySelector<HTMLElement>('[data-reveal="inner"]');
  return outer && inner ? { outer, inner } : null;
}

/** Hide the app inside a zero-size circle at (x, y). Call before the destination renders. */
export function prepareReveal({ outer, inner }: RevealTarget, x: number, y: number, s0: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const R = Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))) + 2;
  Object.assign(outer.style, {
    position: 'fixed',
    left: `${x - R}px`,
    top: `${y - R}px`,
    width: `${R * 2}px`,
    height: `${R * 2}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    zIndex: '250',
    transform: `scale(${s0})`,
    willChange: 'transform',
  });
  Object.assign(inner.style, {
    position: 'absolute',
    left: `${R - x}px`,
    top: `${R - y}px`,
    width: `${w}px`,
    height: `${h}px`,
    overflow: 'hidden',
    transformOrigin: `${x}px ${y}px`,
    transform: `scale(${1 / s0})`,
    willChange: 'transform',
  });
  return R;
}

/** Scale the circle out to full screen; resolves when done and restores the wrappers. */
export function playReveal(target: RevealTarget, s0: number, durationMs: number, ring?: HTMLElement): Promise<void> {
  const scales = Array.from({ length: STEPS + 1 }, (_, i) => s0 + (1 - s0) * easeOut(i / STEPS));
  const opts: KeyframeAnimationOptions = { duration: durationMs, easing: 'linear', fill: 'forwards' };
  const anims = [
    target.outer.animate(scales.map((s) => ({ transform: `scale(${s})` })), opts),
    target.inner.animate(scales.map((s) => ({ transform: `scale(${1 / s})` })), opts),
  ];
  if (ring) anims.push(ring.animate(scales.map((s, i) => ({ transform: `scale(${s})`, opacity: 1 - (i / STEPS) * 0.6 })), opts));
  return Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => {
    anims.forEach((a) => a.cancel());
    resetReveal(target);
  });
}

export function resetReveal({ outer, inner }: RevealTarget) {
  outer.removeAttribute('style');
  inner.removeAttribute('style');
}
