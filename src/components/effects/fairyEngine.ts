/**
 * Ambient fairy effects engine.
 *
 * - One fixed layer (pointer-events: none) holds a <canvas> for all particles
 *   (sparkles, fireflies, petals, stars) and a few fairy <div>s, which are the
 *   only elements that receive pointer events.
 * - A single requestAnimationFrame loop; paused while the tab is hidden.
 * - Colors come from the theme's --fx-* variables (src/index.css).
 * - Reduced motion: no fairies or loop, just a handful of static sparkles.
 */

type Vec = { x: number; y: number };

interface Palette {
  sparkles: string[];
  sparkleGlow: string;
  glowAlpha: number;
  petals: string[];
  petalAlpha: number;
  fireflies: string[];
  stars: string[];
  blend: GlobalCompositeOperation;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number; // drawn radius in px
  rot: number;
  vr: number;
  sprite: HTMLCanvasElement;
  twinkleF: number;
  twinkleP: number;
  bright: number;
}

interface Firefly {
  x: number;
  y: number;
  heading: number;
  turn: number;
  speed: number;
  period: number;
  phase: number;
  size: number;
  sprite: HTMLCanvasElement;
}

interface Star {
  x: number;
  y: number;
  size: number;
  period: number;
  phase: number;
  sprite: HTMLCanvasElement;
}

interface Petal {
  baseX: number;
  y: number;
  vy: number;
  swayAmp: number;
  swayF: number;
  phase: number;
  rot: number;
  vr: number;
  flipF: number;
  size: number;
  sprite: HTMLCanvasElement;
}

type FairyState = 'fly' | 'rest' | 'spin' | 'leave' | 'gone';

interface Segment {
  p0: Vec;
  p1: Vec;
  p2: Vec;
  p3: Vec;
  t: number;
  dur: number;
}

interface Fairy {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: FairyState;
  seg: Segment | null;
  stateUntil: number;
  emitAcc: number;
  nextSpecial: number;
  trailUntil: number;
  cursorVisit: boolean;
  bobPhase: number;
}

const MAX_SPARKLES = 450;
const SPRITE = 64;
const MOBILE_BP = 768;
const FRAME_MS = 1000 / 31;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function bezier(s: Segment, t: number): Vec {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * s.p0.x + b * s.p1.x + c * s.p2.x + d * s.p3.x,
    y: a * s.p0.y + b * s.p1.y + c * s.p2.y + d * s.p3.y,
  };
}

function bezierTangent(s: Segment, t: number): Vec {
  const u = 1 - t;
  return {
    x: 3 * u * u * (s.p1.x - s.p0.x) + 6 * u * t * (s.p2.x - s.p1.x) + 3 * t * t * (s.p3.x - s.p2.x),
    y: 3 * u * u * (s.p1.y - s.p0.y) + 6 * u * t * (s.p2.y - s.p1.y) + 3 * t * t * (s.p3.y - s.p2.y),
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/* ── Sprites (pre-rendered so each particle is a single drawImage) ── */

function makeCanvas(size = SPRITE) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function starSprite(color: string, glow: string, glowAlpha = 0.45): HTMLCanvasElement {
  const c = makeCanvas();
  const g = c.getContext('2d')!;
  const m = SPRITE / 2;
  const halo = g.createRadialGradient(m, m, 0, m, m, m);
  halo.addColorStop(0, withAlpha(glow, glowAlpha));
  halo.addColorStop(0.35, withAlpha(glow, glowAlpha * 0.28));
  halo.addColorStop(1, withAlpha(glow, 0));
  g.fillStyle = halo;
  g.fillRect(0, 0, SPRITE, SPRITE);
  // 4-point star with concave sides
  const r = m * 0.92;
  const k = m * 0.12;
  g.beginPath();
  g.moveTo(m, m - r);
  g.quadraticCurveTo(m + k, m - k, m + r, m);
  g.quadraticCurveTo(m + k, m + k, m, m + r);
  g.quadraticCurveTo(m - k, m + k, m - r, m);
  g.quadraticCurveTo(m - k, m - k, m, m - r);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.beginPath();
  g.arc(m, m, m * 0.1, 0, Math.PI * 2);
  g.fillStyle = withAlpha(color, 0.9);
  g.fill();
  return c;
}

function glowSprite(color: string): HTMLCanvasElement {
  const c = makeCanvas();
  const g = c.getContext('2d')!;
  const m = SPRITE / 2;
  const grad = g.createRadialGradient(m, m, 0, m, m, m);
  grad.addColorStop(0, withAlpha(color, 1));
  grad.addColorStop(0.18, withAlpha(color, 0.8));
  grad.addColorStop(0.45, withAlpha(color, 0.18));
  grad.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  return c;
}

function petalSprite(color: string, leaf: boolean): HTMLCanvasElement {
  const c = makeCanvas(32);
  const g = c.getContext('2d')!;
  g.translate(16, 16);
  g.beginPath();
  if (leaf) {
    g.moveTo(0, -14);
    g.quadraticCurveTo(10, -4, 0, 14);
    g.quadraticCurveTo(-10, -4, 0, -14);
  } else {
    g.moveTo(0, -13);
    g.bezierCurveTo(11, -9, 9, 9, 0, 13);
    g.bezierCurveTo(-9, 9, -11, -9, 0, -13);
  }
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = withAlpha('#000000', 0.08);
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(0, -11);
  g.lineTo(0, 11);
  g.stroke();
  return c;
}

/** Any CSS color → same color with the given alpha (via a 1px canvas). */
const colorCtx = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.getContext('2d', { willReadFrequently: true })!;
})();
function withAlpha(color: string, alpha: number): string {
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = color;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${alpha})`;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const list = (name: string) =>
    cs
      .getPropertyValue(name)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'none');
  const blend = cs.getPropertyValue('--fx-blend').trim();
  return {
    sparkles: list('--fx-sparkles'),
    sparkleGlow: cs.getPropertyValue('--fx-sparkle-glow').trim() || 'transparent',
    glowAlpha: parseFloat(cs.getPropertyValue('--fx-glow-alpha')) || 0.45,
    petalAlpha: parseFloat(cs.getPropertyValue('--fx-petal-alpha')) || 0,
    petals: list('--fx-petals'),
    fireflies: list('--fx-fireflies'),
    stars: list('--fx-stars'),
    blend: (blend === 'lighter' ? 'lighter' : 'source-over') as GlobalCompositeOperation,
  };
}

/* ── Engine ───────────────────────────────────────────────────────── */

export class FairyEngine {
  readonly root: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private mobile = false;
  private reduced: boolean;

  private palette!: Palette;
  private sparkleSprites: HTMLCanvasElement[] = [];
  private fireflySprites: HTMLCanvasElement[] = [];
  private starSprites: HTMLCanvasElement[] = [];
  private petalSprites: HTMLCanvasElement[] = [];

  private sparkles: Sparkle[] = [];
  private pool: Sparkle[] = [];
  private fairies: Fairy[] = [];
  private fireflies: Firefly[] = [];
  private stars: Star[] = [];
  private petals: Petal[] = [];

  private raf = 0;
  private last = 0;
  private now = 0; // seconds of simulated (visible) time
  private cursor: (Vec & { at: number }) | null = null;
  private nextCursorVisit = 0;
  private finePointer = window.matchMedia('(pointer: fine)').matches;

  constructor(reduced: boolean) {
    this.reduced = reduced;
    this.root = document.createElement('div');
    this.root.className = 'fx-layer';
    this.root.setAttribute('aria-hidden', 'true');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fx-canvas';
    this.root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    document.body.appendChild(this.root);

    this.measure();
    this.refreshPalette();
    this.populate();

    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    if (this.finePointer) window.addEventListener('pointermove', this.onPointerMove, { passive: true });

    if (this.reduced) this.drawStatic();
    else this.start();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.root.remove();
  }

  /** Re-read theme colors (call after data-theme changes). */
  setTheme() {
    this.refreshPalette();
    // swap particle colors in place; add/remove theme-only elements
    for (const s of this.sparkles) s.sprite = pick(this.sparkleSprites);
    this.populate();
    if (this.reduced) this.drawStatic();
  }

  /* lifecycle */

  private start() {
    if (this.raf || this.reduced || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private onVisibility = () => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private onResize = () => {
    const wasMobile = this.mobile;
    this.measure();
    if (wasMobile !== this.mobile) this.populate();
    for (const f of this.fairies) {
      f.x = clamp(f.x, 20, this.w - 20);
      f.y = clamp(f.y, 20, this.h - 20);
    }
    for (const s of this.stars) s.y = Math.min(s.y, this.h * 0.24);
    if (this.reduced) this.drawStatic();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.cursor = { x: e.clientX, y: e.clientY, at: this.now };
  };

  private measure() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.mobile = this.w < MOBILE_BP;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private refreshPalette() {
    const p = readPalette();
    this.palette = p;
    this.sparkleSprites = p.sparkles.map((c) => starSprite(c, p.sparkleGlow, p.glowAlpha));
    this.fireflySprites = p.fireflies.map((c) => glowSprite(c));
    this.starSprites = p.stars.map((c) => starSprite(c, c));
    this.petalSprites = p.petals.map((c, i) => petalSprite(c, i === p.petals.length - 1));
  }

  /** Bring entity counts in line with viewport + theme. */
  private populate() {
    const fairyTarget = this.reduced ? 0 : this.mobile ? randInt(2, 3) : randInt(3, 5);
    while (this.fairies.length < fairyTarget) this.fairies.push(this.createFairy(this.fairies.length));
    while (this.fairies.length > fairyTarget) this.fairies.pop()!.el.remove();

    const hasFireflies = this.fireflySprites.length > 0 && !this.reduced;
    const fireflyTarget = hasFireflies ? (this.mobile ? 10 : clamp(Math.round((this.w * this.h) / 70000), 15, 25)) : 0;
    this.fireflies.length = Math.min(this.fireflies.length, fireflyTarget);
    for (const f of this.fireflies) f.sprite = pick(this.fireflySprites);
    while (this.fireflies.length < fireflyTarget) this.fireflies.push(this.createFirefly());

    const starTarget = this.starSprites.length && !this.reduced ? (this.mobile ? 7 : 14) : 0;
    this.stars.length = Math.min(this.stars.length, starTarget);
    for (const s of this.stars) s.sprite = pick(this.starSprites);
    while (this.stars.length < starTarget) this.stars.push(this.createStar());

    const petalTarget = this.petalSprites.length && !this.reduced ? (this.mobile ? 3 : 5) : 0;
    this.petals.length = Math.min(this.petals.length, petalTarget);
    for (const p of this.petals) p.sprite = pick(this.petalSprites);
    while (this.petals.length < petalTarget) this.petals.push(this.createPetal(true));
  }

  /* ── factories ── */

  private createFairy(index: number): Fairy {
    const el = document.createElement('div');
    el.className = `fx-fairy${Math.random() < 0.4 ? ' is-star' : ''}`;
    el.innerHTML =
      '<div class="fx-fairy-inner"><span class="fx-fairy-halo"></span>' +
      '<span class="fx-fairy-wing is-left"></span><span class="fx-fairy-wing is-right"></span>' +
      '<span class="fx-fairy-body"></span></div>';
    // wings flap out of sync between fairies
    el.querySelectorAll<HTMLElement>('.fx-fairy-wing').forEach((w) => (w.style.animationDelay = `${-index * 0.07}s`));
    this.root.appendChild(el);

    const f: Fairy = {
      el,
      x: rand(this.w * 0.1, this.w * 0.9),
      y: rand(this.h * 0.12, this.h * 0.85),
      vx: 0,
      vy: 0,
      state: 'fly',
      seg: null,
      stateUntil: 0,
      emitAcc: 0,
      nextSpecial: this.now + rand(10, 20),
      trailUntil: 0,
      cursorVisit: false,
      bobPhase: rand(0, Math.PI * 2),
    };
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.poke(f);
    });
    this.planWander(f);
    this.place(f, 0);
    return f;
  }

  private createFirefly(): Firefly {
    return {
      x: rand(0, this.w),
      y: rand(this.h * 0.15, this.h),
      heading: rand(0, Math.PI * 2),
      turn: 0,
      speed: rand(6, 15),
      period: rand(2.6, 5.5),
      phase: rand(0, Math.PI * 2),
      size: rand(7, 12),
      sprite: pick(this.fireflySprites),
    };
  }

  private createStar(): Star {
    return {
      x: rand(10, this.w - 10),
      y: rand(8, this.h * 0.22),
      size: rand(2, 4.2),
      period: rand(3.5, 8),
      phase: rand(0, Math.PI * 2),
      sprite: pick(this.starSprites),
    };
  }

  private createPetal(anywhere: boolean): Petal {
    return {
      baseX: rand(0, this.w),
      y: anywhere ? rand(-20, this.h) : rand(-60, -20),
      vy: rand(14, 26),
      swayAmp: rand(18, 42),
      swayF: rand(0.25, 0.55),
      phase: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.6, 0.6),
      flipF: rand(0.4, 0.9),
      size: rand(12, 18),
      sprite: pick(this.petalSprites),
    };
  }

  private spawnSparkle(
    x: number,
    y: number,
    opts: { vx?: number; vy?: number; size?: number; life?: number; bright?: number } = {}
  ) {
    if (!this.sparkleSprites.length) return;
    if (this.sparkles.length >= MAX_SPARKLES) return;
    const s = this.pool.pop() ?? ({} as Sparkle);
    s.x = x;
    s.y = y;
    s.vx = opts.vx ?? rand(-7, 7);
    s.vy = opts.vy ?? rand(-6, 5);
    s.age = 0;
    s.life = opts.life ?? rand(0.9, 1.8);
    s.size = opts.size ?? pickSize();
    s.rot = rand(-0.4, 0.4);
    s.vr = rand(-0.5, 0.5);
    s.sprite = pick(this.sparkleSprites);
    s.twinkleF = rand(5, 9); // rad/s → ~1–1.4 Hz, soft
    s.twinkleP = rand(0, Math.PI * 2);
    s.bright = opts.bright ?? rand(0.55, 0.8);
    this.sparkles.push(s);
  }

  private burst(x: number, y: number, count: number, strength = 1) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(-0.25, 0.25);
      const sp = rand(14, 46) * strength;
      this.spawnSparkle(x, y, {
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: rand(2, 5.5),
        life: rand(1.3, 2.3),
        bright: rand(0.7, 0.9),
      });
    }
  }

  /* ── fairy behaviour ── */

  private setSegment(f: Fairy, target: Vec, speed: number) {
    const p0 = { x: f.x, y: f.y };
    const dx = target.x - p0.x, dy = target.y - p0.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    // keep the tangent of the previous path so curves join smoothly
    let tx = f.vx, ty = f.vy;
    let tl = Math.hypot(tx, ty);
    if (tl < 1) {
      const a = rand(0, Math.PI * 2);
      tx = Math.cos(a);
      ty = Math.sin(a);
      tl = 1;
    }
    const lead = dist * 0.42;
    const ca = rand(0, Math.PI * 2);
    f.seg = {
      p0,
      p1: { x: p0.x + (tx / tl) * lead, y: p0.y + (ty / tl) * lead },
      p2: { x: target.x + Math.cos(ca) * dist * 0.35, y: target.y + Math.sin(ca) * dist * 0.35 },
      p3: target,
      t: 0,
      dur: dist / speed,
    };
  }

  private randomTarget(from: Vec): Vec {
    const m = this.mobile ? 24 : 48;
    for (let i = 0; i < 6; i++) {
      const a = rand(0, Math.PI * 2);
      const d = rand(140, this.mobile ? 260 : 420);
      const x = from.x + Math.cos(a) * d;
      const y = from.y + Math.sin(a) * d;
      if (x > m && x < this.w - m && y > m + 40 && y < this.h - m - 40) return { x, y };
    }
    return { x: rand(m, this.w - m), y: rand(m + 40, this.h - m - 40) };
  }

  private planWander(f: Fairy) {
    f.state = 'fly';
    f.el.classList.remove('is-resting');
    this.setSegment(f, this.randomTarget(f), rand(26, 44));
  }

  private rest(f: Fairy, seconds: number) {
    f.state = 'rest';
    f.seg = null;
    f.vx = f.vy = 0;
    f.stateUntil = this.now + seconds;
    f.el.classList.add('is-resting');
  }

  private offscreenTarget(f: Fairy): Vec {
    const edges = [
      { x: -60, y: f.y + rand(-120, 120) },
      { x: this.w + 60, y: f.y + rand(-120, 120) },
      { x: f.x + rand(-160, 160), y: -60 },
    ];
    // nearest edge
    const d = [f.x, this.w - f.x, f.y];
    return edges[d.indexOf(Math.min(...d))];
  }

  private poke(f: Fairy) {
    if (f.state === 'spin' || f.state === 'leave' || f.state === 'gone') return;
    f.state = 'spin';
    f.seg = null;
    f.stateUntil = this.now + 0.8;
    f.el.classList.remove('is-resting');
    f.el.classList.add('is-spinning');
    this.burst(f.x, f.y, 16, 0.7);
  }

  private respawn(f: Fairy) {
    const fromLeft = Math.random() < 0.5;
    f.x = fromLeft ? -40 : this.w + 40;
    f.y = rand(this.h * 0.15, this.h * 0.75);
    f.vx = fromLeft ? 1 : -1;
    f.vy = 0;
    f.el.style.visibility = '';
    f.el.classList.remove('is-spinning');
    f.nextSpecial = this.now + rand(10, 20);
    f.state = 'fly';
    this.setSegment(f, { x: fromLeft ? rand(80, this.w * 0.45) : rand(this.w * 0.55, this.w - 80), y: rand(this.h * 0.2, this.h * 0.8) }, rand(30, 46));
  }

  private maybeVisitCursor() {
    if (!this.finePointer || !this.cursor || this.now < this.nextCursorVisit) return;
    if (this.now - this.cursor.at > 8) return; // mouse idle / left the page
    const candidates = this.fairies.filter((f) => f.state === 'fly' && !f.cursorVisit);
    if (!candidates.length) return;
    const f = pick(candidates);
    const a = rand(0, Math.PI * 2);
    const d = rand(48, 80);
    const target = {
      x: clamp(this.cursor.x + Math.cos(a) * d, 30, this.w - 30),
      y: clamp(this.cursor.y + Math.sin(a) * d, 30, this.h - 30),
    };
    f.cursorVisit = true;
    this.setSegment(f, target, rand(55, 75));
    this.nextCursorVisit = this.now + rand(25, 45);
  }

  private updateFairy(f: Fairy, dt: number) {
    if (f.state === 'gone') {
      if (this.now >= f.stateUntil) this.respawn(f);
      return;
    }

    if (f.state === 'rest') {
      if (this.now >= f.stateUntil) {
        f.cursorVisit = false;
        this.planWander(f);
      }
    } else if (f.state === 'spin') {
      if (this.now >= f.stateUntil) {
        f.el.classList.remove('is-spinning');
        this.burst(f.x, f.y, 34, 1.7);
        f.state = 'leave';
        f.vx = rand(-1, 1);
        f.vy = -1;
        this.setSegment(f, this.offscreenTarget(f), rand(170, 220));
      }
    } else if (f.seg) {
      const s = f.seg;
      s.t = Math.min(1, s.t + dt / s.dur);
      const tt = f.state === 'leave' ? s.t * s.t : easeInOut(s.t);
      const p = bezier(s, tt);
      if (dt > 0) {
        // smoothed px/s velocity: drives tilt, trail drift and the next curve's tangent
        f.vx += ((p.x - f.x) / dt - f.vx) * 0.25;
        f.vy += ((p.y - f.y) / dt - f.vy) * 0.25;
      }
      f.x = p.x;
      f.y = p.y;
      if (s.t >= 1) {
        const tan = bezierTangent(s, 1);
        const len = Math.hypot(tan.x, tan.y) || 1;
        const speed = Math.max(Math.hypot(f.vx, f.vy), 1);
        f.vx = (tan.x / len) * speed;
        f.vy = (tan.y / len) * speed;
        if (f.state === 'leave') {
          f.state = 'gone';
          f.el.style.visibility = 'hidden';
          f.stateUntil = this.now + rand(6, 10);
          f.cursorVisit = false;
          return;
        }
        if (f.cursorVisit) this.rest(f, rand(1.6, 2.8));
        else if (Math.random() < 0.35) this.rest(f, rand(1.2, 3.5));
        else this.planWander(f);
      }
    }

    // special effect every 10–20 s: a long bright trail or a small burst
    if (this.now >= f.nextSpecial && (f.state === 'fly' || f.state === 'rest')) {
      if (f.state === 'fly' && Math.random() < 0.55) f.trailUntil = this.now + rand(2.2, 3.2);
      else this.burst(f.x, f.y, randInt(16, 24), 0.8);
      f.nextSpecial = this.now + rand(10, 20);
    }

    // trail
    const trail = this.now < f.trailUntil;
    const moving = f.state === 'fly' || f.state === 'leave';
    const rate = moving ? (trail ? 34 : 11) : f.state === 'rest' ? 1.4 : 0;
    f.emitAcc += rate * dt;
    while (f.emitAcc >= 1) {
      f.emitAcc -= 1;
      const back = moving ? 0.06 : 0;
      this.spawnSparkle(f.x + rand(-3, 3), f.y + rand(-2, 4), {
        vx: -f.vx * back + rand(-7, 7),
        vy: -f.vy * back + rand(-5, 6),
        size: trail ? rand(2, 5) : pickSize(),
        life: trail ? rand(1.8, 2.8) : rand(0.9, 1.8),
        bright: trail ? rand(0.75, 0.92) : undefined,
      });
    }

    this.place(f, dt);
  }

  private place(f: Fairy, dt: number) {
    f.bobPhase += dt * (f.state === 'rest' ? 1.8 : 3.2);
    const bob = Math.sin(f.bobPhase) * (f.state === 'rest' ? 2.5 : 1.5);
    const tilt = f.state === 'spin' ? 0 : clamp(f.vx * 0.12, -14, 14);
    f.el.style.transform = `translate3d(${f.x.toFixed(1)}px, ${(f.y + bob).toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`;
  }

  /* ── loop ── */

  private frame = (ts: number) => {
    // Slow, ambient motion: ~30 fps is indistinguishable and halves the work
    // (wing flaps, halos and spins are CSS animations and stay at full rate).
    if (ts - this.last < FRAME_MS) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    const dt = Math.min(0.066, (ts - this.last) / 1000);
    this.last = ts;
    this.now += dt;

    this.maybeVisitCursor();
    for (const f of this.fairies) this.updateFairy(f, dt);
    this.draw(dt);

    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(dt: number) {
    const g = this.ctx;
    g.clearRect(0, 0, this.w, this.h);
    const t = this.now;

    // petals (normal blending so they read as solid on light backgrounds)
    g.globalCompositeOperation = 'source-over';
    for (const p of this.petals) {
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > this.h + 30) Object.assign(p, this.createPetal(false));
      const x = p.baseX + Math.sin(t * p.swayF * Math.PI * 2 + p.phase) * p.swayAmp;
      const flip = Math.cos(t * p.flipF * Math.PI + p.phase);
      g.globalAlpha = this.palette.petalAlpha;
      g.setTransform(this.dpr, 0, 0, this.dpr, x * this.dpr, p.y * this.dpr);
      g.rotate(p.rot);
      g.scale(0.35 + 0.65 * Math.abs(flip), 1);
      g.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size * 1.1);
    }
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    g.globalCompositeOperation = this.palette.blend;

    // stars near the top
    for (const s of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin((t / s.period) * Math.PI * 2 + s.phase);
      g.globalAlpha = 0.18 + 0.55 * tw;
      const sz = s.size * (0.85 + 0.3 * tw) * 2;
      g.drawImage(s.sprite, s.x - sz / 2, s.y - sz / 2, sz, sz);
    }

    // fireflies: wander + soft blink
    for (const f of this.fireflies) {
      f.turn = clamp(f.turn + rand(-1.6, 1.6) * dt, -0.9, 0.9);
      f.heading += f.turn * dt;
      f.x += Math.cos(f.heading) * f.speed * dt;
      f.y += Math.sin(f.heading) * f.speed * dt;
      if (f.x < -20) f.x = this.w + 20;
      else if (f.x > this.w + 20) f.x = -20;
      if (f.y < this.h * 0.1) f.heading = Math.abs(f.heading) % Math.PI;
      else if (f.y > this.h + 20) f.y = this.h * 0.2;
      const b = Math.max(0, Math.sin((t / f.period) * Math.PI * 2 + f.phase));
      const lit = b * b * b;
      g.globalAlpha = 0.1 + 0.75 * lit;
      const sz = f.size * (0.8 + 0.45 * lit) * 2;
      g.drawImage(f.sprite, f.x - sz / 2, f.y - sz / 2, sz, sz);
    }

    // sparkles: twinkle (scale + fade), drift, disappear
    const drag = Math.exp(-1.4 * dt);
    let alive = 0;
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      s.age += dt;
      if (s.age >= s.life) {
        this.pool.push(s);
        continue;
      }
      this.sparkles[alive++] = s;
      s.vx *= drag;
      s.vy = s.vy * drag + 5 * dt; // settle gently downward
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;

      const k = s.age / s.life;
      const env = k < 0.18 ? k / 0.18 : 1 - ((k - 0.18) / 0.82) ** 1.6;
      const tw = Math.sin(s.age * s.twinkleF + s.twinkleP);
      const scale = env * (0.82 + 0.18 * tw);
      const sz = s.size * 1.6 * scale; // sprite half-extent
      if (sz < 0.2) continue;
      g.globalAlpha = Math.min(0.9, env * s.bright * (0.8 + 0.2 * tw));
      g.setTransform(this.dpr, 0, 0, this.dpr, s.x * this.dpr, s.y * this.dpr);
      g.rotate(s.rot);
      g.drawImage(s.sprite, -sz, -sz, sz * 2, sz * 2);
    }
    this.sparkles.length = alive;

    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  /** Reduced motion: a few still sparkles in the corners, drawn once. */
  private drawStatic() {
    const g = this.ctx;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    if (!this.sparkleSprites.length) return;
    g.globalCompositeOperation = this.palette.blend;
    const spots = [
      [0.06, 0.16], [0.1, 0.24], [0.9, 0.14], [0.94, 0.22],
      [0.86, 0.9], [0.08, 0.88], [0.5, 0.06],
    ];
    spots.forEach(([fx, fy], i) => {
      const sz = (i % 3 === 0 ? 6 : 4) * 2;
      g.globalAlpha = 0.45;
      g.drawImage(this.sparkleSprites[i % this.sparkleSprites.length], fx * this.w - sz, fy * this.h - sz, sz * 2, sz * 2);
    });
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
}

/** Mostly tiny sparkles with the occasional larger one. */
function pickSize() {
  const r = Math.random();
  return r < 0.6 ? rand(1, 2.2) : r < 0.9 ? rand(2.2, 3.4) : rand(3.4, 4.6);
}
