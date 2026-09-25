import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { flowerPath, leafPath, stop } from './sceneUtils';
import './gate.css';

/*
 * Leather scroll holding the login form.
 * Desktop (lg+): opens horizontally, rollers left/right.
 * Mobile: opens vertically, rollers top/bottom.
 * Parts (for later unrolling): ScrollAura, ScrollRoller ×2 (+ caps, tassels),
 * ScrollBody (leather, stitching, ornaments) and the form content.
 */

/* ── Roller pieces ─────────────────────────────────────────────────── */

/** Gold finial; drawn pointing up, rotated per position. */
const RollerCap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const id = useId();
  return (
    <svg data-part="roller-cap" className={`shrink-0 w-[30px] h-[30px] ${className}`} viewBox="0 0 30 30" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-g`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" style={stop('gilt-light')} />
          <stop offset="0.55" style={stop('gilt')} />
          <stop offset="1" style={stop('gilt-deep')} />
        </radialGradient>
      </defs>
      <rect x={6} y={20} width={18} height={9} rx={2} fill={`url(#${id}-g)`} className="stroke-scene-gilt-deep" strokeWidth={0.8} />
      <rect x={4} y={17} width={22} height={4} rx={2} fill={`url(#${id}-g)`} className="stroke-scene-gilt-deep" strokeWidth={0.8} />
      <circle cx={15} cy={10} r={8} fill={`url(#${id}-g)`} className="stroke-scene-gilt-deep" strokeWidth={0.8} />
      <circle cx={15} cy={2.5} r={2} fill={`url(#${id}-g)`} className="stroke-scene-gilt-deep" strokeWidth={0.6} />
    </svg>
  );
};

/** Lavender silk tassel hanging from a roller end. */
export const Tassel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const id = useId();
  const strands = Array.from({ length: 11 }, (_, i) => -7 + i * 1.4);
  return (
    <svg data-part="tassel" className={`w-[20px] h-[74px] ${className}`} viewBox="0 0 20 74" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-silk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('tassel-dark')} />
          <stop offset="0.5" style={stop('tassel')} />
          <stop offset="1" style={stop('wisteria-light')} />
        </linearGradient>
      </defs>
      <path d="M10,0 C12,8 8,14 10,22" fill="none" className="stroke-scene-tassel-dark" strokeWidth={1.4} />
      <circle cx={10} cy={25} r={4} className="fill-scene-gilt stroke-scene-gilt-deep" strokeWidth={0.8} />
      <path d="M5,30 Q10,27 15,30 L15,34 Q10,32 5,34 Z" className="fill-scene-tassel-dark" />
      <g stroke={`url(#${id}-silk)`} strokeWidth={1.3} strokeLinecap="round" fill="none">
        {strands.map((dx, i) => (
          <path key={i} d={`M${10 + dx * 0.5},33 Q${10 + dx * 0.8},52 ${10 + dx},${70 + (i % 3)}`} />
        ))}
      </g>
      <path d="M5.5,38 Q10,36 14.5,38" fill="none" className="stroke-scene-gilt" strokeWidth={1.2} />
    </svg>
  );
};

/**
 * Wooden roller. `position="start"` is the top (mobile) / left (desktop) one.
 * Tassels: desktop — under each roller; mobile — from both ends of the bottom roller.
 */
export const ScrollRoller: React.FC<{ position: 'start' | 'end' }> = ({ position }) => {
  const start = position === 'start';
  return (
    <div
      data-part={`roller-${position}`}
      className="relative z-10 shrink-0 flex items-center flex-row w-[calc(100%+28px)] h-[26px] lg:flex-col lg:w-[26px] lg:h-auto lg:self-stretch lg:-my-6"
    >
      <RollerCap className="-rotate-90 lg:rotate-0" />
      <div className="scroll-rod flex-1 self-stretch rounded-[5px] mx-[-3px] my-[1px] lg:my-[-3px] lg:mx-[1px]" />
      <RollerCap className="rotate-90 lg:rotate-180" />

      {/* desktop: tassel hangs under the bottom cap */}
      <Tassel className="hidden lg:block absolute left-1/2 top-full -translate-x-1/2 -mt-1" />
      {/* mobile: tassels from both ends of the bottom roller */}
      {!start && (
        <>
          <Tassel className="lg:hidden absolute left-[3px] top-[70%]" />
          <Tassel className="lg:hidden absolute right-[3px] top-[70%]" />
        </>
      )}
    </div>
  );
};

/* ── Leather body decorations ──────────────────────────────────────── */

const LeatherGrain: React.FC = () => {
  const id = useId();
  return (
    <svg className="scroll-grain" aria-hidden="true">
      <filter id={`${id}-grain`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.9" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id}-grain)`} />
    </svg>
  );
};

const Stitching: React.FC = () => (
  <svg className="scroll-stitch" aria-hidden="true">
    <rect className="stitch-shadow stroke-scene-leather-light" x={13} y={13} rx={8} fill="none" strokeWidth={1.2} strokeDasharray="7 5" strokeLinecap="round" opacity={0.8} />
    <rect className="stroke-scene-stitch" x={12} y={12} rx={8} fill="none" strokeWidth={1.6} strokeDasharray="7 5" strokeLinecap="round" />
  </svg>
);

/** Tooled flower sprig for a corner; drawn for the top-left corner. */
const CornerOrnament: React.FC<{ corner: 'tl' | 'tr' | 'bl' | 'br' }> = ({ corner }) => {
  const place = {
    tl: 'top-[18px] left-[18px]',
    tr: 'top-[18px] right-[18px] -scale-x-100',
    bl: 'bottom-[18px] left-[18px] -scale-y-100',
    br: 'bottom-[18px] right-[18px] -scale-x-100 -scale-y-100',
  }[corner];
  return (
    <svg data-part={`ornament-${corner}`} className={`absolute w-[46px] h-[46px] pointer-events-none ${place}`} viewBox="0 0 46 46" aria-hidden="true">
      <path d="M4,42 C6,28 14,16 30,6" fill="none" className="stroke-scene-stitch" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M4,42 C14,40 26,34 40,20" fill="none" className="stroke-scene-stitch" strokeWidth={1.2} strokeLinecap="round" />
      <path d={leafPath(11)} className="fill-scene-ivy stroke-scene-ivy-dark" strokeWidth={0.6} transform="translate(12,22) rotate(-30)" />
      <path d={leafPath(10)} className="fill-scene-ivy stroke-scene-ivy-dark" strokeWidth={0.6} transform="translate(24,34) rotate(60)" />
      <path d={leafPath(8)} className="fill-scene-ivy-light stroke-scene-ivy-dark" strokeWidth={0.6} transform="translate(30,10) rotate(40)" />
      <g transform="translate(11,35)">
        <path d={flowerPath(8)} className="fill-scene-wax-light stroke-scene-wax-dark" strokeWidth={0.7} />
        <circle r={2.2} className="fill-scene-gilt" />
      </g>
      <circle cx={33} cy={6} r={2.2} className="fill-scene-wax-light stroke-scene-wax-dark" strokeWidth={0.5} />
      <circle cx={40} cy={20} r={1.8} className="fill-scene-wax-light stroke-scene-wax-dark" strokeWidth={0.5} />
    </svg>
  );
};

const Divider: React.FC = () => (
  <svg className="w-40 h-3 mx-auto" viewBox="0 0 160 12" aria-hidden="true">
    <path d="M4,6 H66 M94,6 H156" className="stroke-scene-stitch" strokeWidth={1} strokeLinecap="round" />
    <path d={leafPath(9)} className="fill-scene-ivy" transform="translate(72,6) rotate(-70)" />
    <path d={leafPath(9)} className="fill-scene-ivy" transform="translate(88,6) rotate(70)" />
    <g transform="translate(80,6)">
      <path d={flowerPath(5)} className="fill-scene-wax-light stroke-scene-wax-dark" strokeWidth={0.6} />
      <circle r={1.5} className="fill-scene-gilt" />
    </g>
  </svg>
);

/* ── Form pieces ───────────────────────────────────────────────────── */

const LeafIcon: React.FC = () => (
  <svg className="w-4 h-4 shrink-0 mb-[7px]" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2,14 C3,6 8,2 14,2 C14,9 9,14 2,14 Z" className="fill-scene-ivy" />
    <path d="M2.5,13.5 C6,10 9,7 12,4" fill="none" className="stroke-scene-ivy-dark" strokeWidth={1} strokeLinecap="round" />
  </svg>
);

const InkLine: React.FC = () => (
  <svg className="ink-line" viewBox="0 0 300 6" preserveAspectRatio="none" aria-hidden="true">
    <path d="M1,3.5 C40,2 70,4.6 110,3.2 S190,2.2 230,3.8 S280,3 299,2.8" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  </svg>
);

const InkField: React.FC<{
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ id, label, error, children }) => (
  <div>
    <div className={`ink-field relative pb-0.5 ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="ink-label block pl-6">
        {label}
      </label>
      <div className="flex items-end gap-2">
        <LeafIcon />
        {children}
      </div>
      <InkLine />
    </div>
    {error && (
      <p id={`${id}-error`} className="ink-error pl-6 mt-1">
        {error}
      </p>
    )}
  </div>
);

/** Round lavender wax seal = submit button. */
const WaxSeal: React.FC<{ label: string }> = ({ label }) => {
  const id = useId();
  // irregular wax rim
  const rim = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = 44 + (i % 3 === 0 ? 3 : i % 2 ? -1 : 1.5);
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
  });
  return (
    <svg className="w-[92px] h-[92px]" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-wax`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" style={stop('wax-light')} />
          <stop offset="0.55" style={stop('wax')} />
          <stop offset="1" style={stop('wax-dark')} />
        </radialGradient>
      </defs>
      <polygon points={rim.join(' ')} fill={`url(#${id}-wax)`} strokeLinejoin="round" className="stroke-scene-wax" strokeWidth={6} />
      <circle cx={50} cy={50} r={33} fill="none" className="stroke-scene-wax-dark" strokeWidth={1.6} opacity={0.7} />
      <circle cx={50.8} cy={50.8} r={33} fill="none" className="stroke-scene-wax-light" strokeWidth={1} opacity={0.8} />
      <g transform="translate(50,36)">
        <path d={flowerPath(11)} className="fill-scene-wax-dark" opacity={0.55} transform="translate(0.8,0.8)" />
        <path d={flowerPath(11)} className="fill-scene-wax-light" />
        <circle r={3} className="fill-scene-wax" />
      </g>
      <text x={50} y={67} textAnchor="middle" fontSize={14} fontWeight={700} style={{ fontFamily: 'var(--font-serif)' }} className="fill-scene-wax-dark" opacity={0.8} transform="translate(0.7,0.7)">
        {label}
      </text>
      <text x={50} y={67} textAnchor="middle" fontSize={14} fontWeight={700} style={{ fontFamily: 'var(--font-serif)' }} className="fill-scene-on-wax">
        {label}
      </text>
    </svg>
  );
};

const GoogleGlyph: React.FC = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
);

/* ── ScrollForm ────────────────────────────────────────────────────── */

export interface ScrollFormErrors {
  identifier?: string;
  password?: string;
  /** Form-level message, e.g. wrong credentials */
  form?: string;
}

export interface ScrollFormProps {
  identifier: string;
  password: string;
  remember: boolean;
  isLoading: boolean;
  errors: ScrollFormErrors;
  /** Bumped after each failed submit; focus then moves to the first invalid field. */
  focusInvalidKey?: number;
  onIdentifierChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onRememberChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  className?: string;
}

export const ScrollForm: React.FC<ScrollFormProps> = ({
  identifier,
  password,
  remember,
  isLoading,
  errors,
  focusInvalidKey = 0,
  onIdentifierChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
  onGoogle,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const uid = useId();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // After a failed submit (only then — not while typing), focus the first invalid field.
  useEffect(() => {
    if (!focusInvalidKey) return;
    if (errors.identifier) identifierRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusInvalidKey]);

  return (
    <div data-part="scroll" className={`relative flex flex-col items-center lg:flex-row lg:items-stretch ${className}`}>
      <div data-part="scroll-aura" className="scroll-aura" aria-hidden="true" />
      <ScrollRoller position="start" />

      <div data-part="scroll-body" className="scroll-leather w-full lg:w-[500px] -my-[3px] lg:my-0 lg:-mx-[3px]">
        <LeatherGrain />
        <Stitching />
        <CornerOrnament corner="tl" />
        <CornerOrnament corner="tr" />
        <CornerOrnament corner="bl" />
        <CornerOrnament corner="br" />

        <form data-part="scroll-content" onSubmit={onSubmit} noValidate className="relative flex flex-col gap-3.5 px-8 pt-9 pb-8 sm:px-10 lg:px-12 lg:pt-10 lg:pb-9">
          <div className="text-center">
            <h2 className="gilt-text text-[27px] sm:text-[31px] lg:text-[34px] font-bold leading-tight text-balance">
              Chào mừng nàng trở về khu vườn
            </h2>
            <div className="mt-2">
              <Divider />
            </div>
          </div>

          <InkField id={`${uid}-identifier`} label="Email hoặc tên đăng nhập" error={errors.identifier}>
            <input
              ref={identifierRef}
              id={`${uid}-identifier`}
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => onIdentifierChange(e.target.value)}
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? `${uid}-identifier-error` : undefined}
              className="ink-input"
            />
          </InkField>

          <InkField id={`${uid}-password`} label="Mật khẩu" error={errors.password}>
            <input
              ref={passwordRef}
              id={`${uid}-password`}
              name="password"
              minLength={8}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${uid}-password-error` : undefined}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="ink-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              className="scroll-focus shrink-0 mb-1 p-1.5 -mr-1.5 text-scene-ink-muted hover:text-scene-ink cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </InkField>

          {errors.form && (
            <p role="alert" className="ink-error ink-error-banner text-center">
              {errors.form}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 text-[13px]">
            <label className="flex items-center gap-1.5 text-scene-ink-muted cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => onRememberChange(e.target.checked)} className="ink-check cursor-pointer" />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" className="ink-link">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="flex items-center justify-center gap-5 pt-1">
            <button type="button" onClick={onGoogle} className="leather-round scroll-focus w-11 h-11" aria-label="Đăng nhập bằng Google" title="Đăng nhập bằng Google">
              <GoogleGlyph />
            </button>
            <button type="submit" disabled={isLoading} aria-busy={isLoading} className="seal-button scroll-focus" aria-label="Bước vào">
              <WaxSeal label="Bước vào" />
            </button>
            <span className="w-11 h-11" aria-hidden="true" />
          </div>

          <p className="text-center text-[13px] text-scene-ink-muted">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="ink-link font-semibold">
              Đăng ký
            </Link>
          </p>
        </form>
      </div>

      <ScrollRoller position="end" />
    </div>
  );
};
