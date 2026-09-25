import type { WheelController } from './ornaments/wheelController';
import { getRevealTarget, playReveal, prepareReveal, resetReveal } from './arrivalReveal';

/*
 * Login success sequence for the night-sky scene (≈3.5s):
 *   0–0.4s    form dissolves into gold dust, frame fades
 *   0.4–1.8s  wheel awakens: rings brighten outside → in, every ring eases
 *             up to 8× its idle speed in its own direction (WheelController)
 *   1.8–2.4s  rings ease to rest with their dividers lined up, then a gold
 *             pulse runs outward and the moon flares
 *   2.4–3.1s  a dark vortex opens; wheel, stars, dust and ornaments spiral in;
 *             the background stretches toward the center; the vortex
 *             collapses into a bright point
 *   3.1–3.5s  session starts; the destination opens outward from the point
 *             (circle reveal, transforms only)
 * Reduced motion: form fades, soft veil, commit, veil fades.
 * Input is blocked from the first frame until the destination is revealed.
 */

const T_AWAKEN = 400;
const AWAKEN_S = 1.4;
const T_ALIGN = 1800;
const ALIGN_S = 0.45;
const T_BLACKHOLE = 2400;
const T_COLLAPSE = 2950;
const T_ARRIVE = 3100;
const REVEAL_MS = 400;
const REVEAL_S0 = 0.004;

interface Options {
  root: HTMLElement;
  wheel: WheelController | null;
  reduced: boolean;
  onCommit: () => void;
}

function spawnDust(root: HTMLElement): HTMLDivElement {
  const layer = document.createElement('div');
  layer.className = 'orn-dissolve-layer';
  layer.setAttribute('aria-hidden', 'true');
  const parts = root.querySelectorAll<HTMLElement>('.celestial-frame header > *, .celestial-frame form > *');
  let budget = 90;
  parts.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || budget <= 0) return;
    const n = Math.min(budget, Math.max(3, Math.round((r.width * r.height) / 900)), 14);
    budget -= n;
    for (let i = 0; i < n; i++) {
      const mote = document.createElement('span');
      mote.className = 'orn-dissolve-mote';
      mote.style.left = `${r.left + Math.random() * r.width}px`;
      mote.style.top = `${r.top + Math.random() * r.height}px`;
      mote.style.setProperty('--s', `${(1.4 + Math.random() * 1.8).toFixed(1)}px`);
      mote.style.setProperty('--dx', `${((Math.random() - 0.5) * 30).toFixed(0)}px`);
      mote.style.setProperty('--dy', `${(-40 - Math.random() * 60).toFixed(0)}px`);
      mote.style.setProperty('--d', `${(0.5 + Math.random() * 0.35).toFixed(2)}s`);
      mote.style.setProperty('--delay', `${(Math.random() * 0.15).toFixed(2)}s`);
      layer.appendChild(mote);
    }
  });
  root.appendChild(layer);
  return layer;
}

/** Starts the sequence. Returns a cancel function (safe to call any time). */
export function runSuccessSequence({ root, wheel, reduced, onCommit }: Options): () => void {
  let committed = false;
  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const target = getRevealTarget();

  /* input blocker + veil (on <body>, so it survives the route change) */
  const veil = document.createElement('div');
  veil.className = 'orn-arrival-veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);
  const block = (e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const keyEvents = ['keydown', 'keypress', 'keyup'] as const;
  keyEvents.forEach((t) => window.addEventListener(t, block, true));
  (document.activeElement as HTMLElement | null)?.blur?.();

  const finish = () => {
    veil.remove();
    keyEvents.forEach((t) => window.removeEventListener(t, block, true));
  };

  root.classList.remove('is-intro');

  /* ── Reduced motion: a soft fade ── */
  if (reduced) {
    root.classList.add('is-success-reduced');
    veil.classList.add('is-soft');
    at(200, () => {
      veil.style.setProperty('--veil-ms', '500ms');
      veil.classList.add('is-on');
    });
    at(800, () => {
      committed = true;
      onCommit();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          veil.classList.remove('is-on');
          window.setTimeout(finish, 550);
        })
      );
    });
  } else {
    /* ── Full sequence ── */
    root.classList.add('is-success');
    const dust = spawnDust(root);
    at(1200, () => dust.remove());

    // 0.4–1.8s: every ring eases up to 8× idle, each in its own direction
    at(T_AWAKEN, () => wheel?.rampSpeed(8, AWAKEN_S));

    // 1.8s: ease into alignment, then pulse + moon flare
    const pulse = () => root.classList.add('is-pulse');
    at(T_ALIGN, () => {
      if (wheel) wheel.alignRings(ALIGN_S, pulse);
      else pulse();
    });
    at(T_ALIGN + ALIGN_S * 1000 + 120, pulse); // safety if rAF is throttled

    // 2.4s: black hole
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    at(T_BLACKHOLE, () => {
      const wheelEl = root.querySelector('[data-part="zodiac-wheel"]');
      if (wheelEl) {
        const r = wheelEl.getBoundingClientRect();
        cx = r.left + r.width / 2;
        cy = r.top + r.height / 2;
      }
      const rr = root.getBoundingClientRect();
      const ox = `${(cx - rr.left).toFixed(1)}px`;
      const oy = `${(cy - rr.top).toFixed(1)}px`;
      root.style.setProperty('--vx', ox);
      root.style.setProperty('--vy', oy);
      const scene = root.querySelector<HTMLElement>('[data-spiral="scene"]');
      if (scene) scene.style.transformOrigin = `${ox} ${oy}`;
      // the artwork is its own centered box: stretch it toward the vortex
      const sky = root.querySelector<HTMLElement>('[data-part="sky"]');
      if (sky) {
        const sr = sky.getBoundingClientRect();
        sky.style.transformOrigin = `${(cx - sr.left).toFixed(1)}px ${(cy - sr.top).toFixed(1)}px`;
      }
      root.classList.add('is-blackhole');
    });

    // 2.95s: collapse into a bright point; the veil takes over with the point
    at(T_COLLAPSE, () => {
      root.classList.add('is-collapse');
      const point = document.createElement('span');
      point.className = 'orn-arrival-point';
      point.style.left = `${cx}px`;
      point.style.top = `${cy}px`;
      veil.appendChild(point);
      veil.style.setProperty('--veil-ms', '150ms');
      veil.classList.add('is-on');
    });

    // 3.1s: start the session and open the destination from the point
    at(T_ARRIVE, () => {
      let ring: HTMLElement | undefined;
      if (target) {
        const R = prepareReveal(target, cx, cy, REVEAL_S0);
        ring = document.createElement('span');
        ring.className = 'orn-arrival-ring';
        Object.assign(ring.style, {
          left: `${cx - R}px`,
          top: `${cy - R}px`,
          width: `${R * 2}px`,
          height: `${R * 2}px`,
          transform: `scale(${REVEAL_S0})`,
        });
        veil.appendChild(ring);
      }
      committed = true;
      onCommit();
      // let the router render the destination inside the (tiny) circle
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!target) {
            veil.style.setProperty('--veil-ms', '400ms');
            veil.classList.remove('is-on');
            window.setTimeout(finish, 450);
            return;
          }
          playReveal(target, REVEAL_S0, REVEAL_MS, ring).then(finish);
        })
      );
    });
  }

  return () => {
    // After commit the login page unmounts; the reveal must finish on its own.
    if (committed) return;
    timers.forEach((t) => window.clearTimeout(t));
    finish();
    if (target) resetReveal(target);
    root.classList.remove('is-success', 'is-success-reduced', 'is-pulse', 'is-blackhole', 'is-collapse');
    root.querySelectorAll('.orn-dissolve-layer').forEach((el) => el.remove());
  };
}
