/**
 * Drives every zodiac ring from ONE requestAnimationFrame loop and ONE clock.
 * Each ring keeps an accumulated angle, so speed changes never make it jump.
 *
 *   ring        direction   idle period
 *   outer       cw          120 s   (names + constellations)
 *   numerals    ccw          90 s
 *   glyphs      cw           70 s
 *   inner       ccw          50 s   (ornamental ticks)
 *
 * The center moon doesn't rotate (it only breathes, in CSS).
 */

export type RingId = 'outer' | 'numerals' | 'glyphs' | 'inner';

export const RING_SPECS: Record<RingId, { dir: 1 | -1; period: number }> = {
  outer: { dir: 1, period: 120 },
  numerals: { dir: -1, period: 90 },
  glyphs: { dir: 1, period: 70 },
  inner: { dir: -1, period: 50 },
};

interface Ring {
  id: RingId;
  el: HTMLElement;
  dir: 1 | -1;
  omega: number; // idle speed, deg/s (unsigned)
  angle: number; // accumulated, deg
  velocity: number; // current signed deg/s
  align?: { from: number; v0: number; to: number; t: number; dur: number };
}

const FOCUS_BOOST = 1.8;

export class WheelController {
  private rings: Ring[];
  private raf = 0;
  private last = 0;
  private running = false;
  /** speed multiplier applied to every ring's idle speed */
  private multiplier = 1;
  private multiplierTarget = 1;
  private multiplierRate = 3; // how fast `multiplier` follows its target (1/s)
  private rampFrom = 1;
  private ramp?: { to: number; t: number; dur: number };
  private focusBoost = false;
  private onDone?: () => void;

  constructor(elements: Partial<Record<RingId, HTMLElement | null>>) {
    this.rings = (Object.keys(RING_SPECS) as RingId[]).flatMap((id) => {
      const el = elements[id];
      if (!el) return [];
      const spec = RING_SPECS[id];
      return [{ id, el, dir: spec.dir, omega: 360 / spec.period, angle: 0, velocity: 0 }];
    });
    document.addEventListener('focusin', this.onFocus);
    document.addEventListener('focusout', this.onFocus);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    document.removeEventListener('focusin', this.onFocus);
    document.removeEventListener('focusout', this.onFocus);
  }

  /** Smoothly change every ring's speed to `factor`× idle over `durS` (smoothstep). */
  rampSpeed(factor: number, durS: number) {
    this.rampFrom = this.multiplier;
    this.ramp = { to: factor, t: 0, dur: durS };
  }

  /**
   * Ease every ring to rest on its nearest 30° step ahead (dividers line up at
   * their starting angles) over `durS`, keeping its current velocity at the start.
   */
  alignRings(durS: number, onDone?: () => void) {
    this.ramp = undefined;
    for (const r of this.rings) {
      const v0 = r.velocity; // signed deg/s
      // travel at least a third of what the current speed would cover, so the
      // ring always decelerates forward, never backs up
      const minTravel = (Math.abs(v0) * durS) / 3;
      const aheadRaw = r.dir > 0 ? r.angle + minTravel : r.angle - minTravel;
      const to = r.dir > 0 ? Math.ceil(aheadRaw / 30) * 30 : Math.floor(aheadRaw / 30) * 30;
      r.align = { from: r.angle, v0, to, t: 0, dur: durS };
    }
    this.onDone = onDone;
  }

  private onFocus = () => {
    const el = document.activeElement as HTMLElement | null;
    this.focusBoost = !!el?.classList?.contains('celestial-input');
  };

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); // hidden tab → no jump
    this.last = now;

    if (this.ramp) {
      this.ramp.t = Math.min(this.ramp.dur, this.ramp.t + dt);
      const k = this.ramp.t / this.ramp.dur;
      const s = k * k * (3 - 2 * k);
      this.multiplier = this.rampFrom + (this.ramp.to - this.rampFrom) * s;
      if (k >= 1) this.ramp = undefined;
    } else {
      this.multiplierTarget = this.focusBoost ? FOCUS_BOOST : 1;
      if (this.multiplier !== this.multiplierTarget && !this.rings.some((r) => r.align)) {
        this.multiplier += (this.multiplierTarget - this.multiplier) * Math.min(1, dt * this.multiplierRate);
      }
    }

    let aligning = false;
    for (const r of this.rings) {
      if (r.align) {
        aligning = true;
        const a = r.align;
        a.t = Math.min(a.dur, a.t + dt);
        const s = a.t / a.dur;
        // cubic Hermite: position a.from→a.to, velocity v0→0
        const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
        const h10 = s ** 3 - 2 * s ** 2 + s;
        const h01 = -2 * s ** 3 + 3 * s ** 2;
        const next = h00 * a.from + h10 * a.dur * a.v0 + h01 * a.to;
        r.velocity = dt > 0 ? (next - r.angle) / dt : 0;
        r.angle = next;
        if (s >= 1) {
          r.angle = a.to;
          r.velocity = 0;
          r.align = undefined;
        }
      } else if (!this.onDone || this.ramp) {
        r.velocity = r.dir * r.omega * this.multiplier;
        r.angle += r.velocity * dt;
      }
      r.el.style.transform = `rotate(${r.angle.toFixed(3)}deg)`;
    }

    if (this.onDone && !aligning) {
      const done = this.onDone;
      this.onDone = undefined;
      // rings stay parked at their aligned angles
      this.stop();
      done();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };
}
