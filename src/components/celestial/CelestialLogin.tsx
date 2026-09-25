import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import skyBackground from '../../assets/images/login-celestial-night.jpg';
import './celestial.css';

/*
 * Mobile login on the night-sky artwork: a thin gold arched frame with a
 * crescent moon, sitting in the empty center of the image. LoginPage owns all
 * state, validation and auth.
 */

export interface LoginFormErrors {
  identifier?: string;
  password?: string;
  /** Form-level message, e.g. wrong credentials */
  form?: string;
}

export interface LoginFormProps {
  identifier: string;
  password: string;
  remember: boolean;
  isLoading: boolean;
  errors: LoginFormErrors;
  /** Bumped after each failed submit; focus then moves to the first invalid field. */
  focusInvalidKey?: number;
  onIdentifierChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onRememberChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
}

export type CelestialLoginProps = LoginFormProps & {
  /** Extra classes on the page root (intro / denied / paused states). */
  stageClassName?: string;
  rootRef?: React.Ref<HTMLElement>;
  onStagePointerDown?: () => void;
  /** Full-screen decorations between the background and the form. */
  sceneDecor?: React.ReactNode;
  /** Decorations positioned relative to the frame box, behind / in front of it. */
  frameBehind?: React.ReactNode;
  frameFront?: React.ReactNode;
};

/* ── Line icons (gold strokes) ──────────────────────────────────────── */

const MoonLine: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10.8 2.2A6 6 0 1 0 13.8 11 4.8 4.8 0 0 1 10.8 2.2Z" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
  </svg>
);

const StarLine: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.5 9.3 6.7 14.5 8 9.3 9.3 8 14.5 6.7 9.3 1.5 8 6.7 6.7Z" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
  </svg>
);

const TinyStar: React.FC<{ className?: string }> = ({ className = 'w-2.5 h-2.5' }) => (
  <svg className={className} viewBox="0 0 10 10" aria-hidden="true">
    <path d="M5 0 5.8 4.2 10 5 5.8 5.8 5 10 4.2 5.8 0 5 4.2 4.2Z" fill="currentColor" />
  </svg>
);

/** Crescent hanging from a dotted chain at the apex of the arch. */
const ArchMoon: React.FC = () => (
  <svg data-part="arch-moon" className="absolute left-1/2 -top-[34px] -translate-x-1/2 w-9 h-12 text-celestial-gold" viewBox="0 0 36 48" aria-hidden="true">
    <circle cx={18} cy={3} r={1.1} fill="currentColor" />
    <path d="M18 6.5 19.4 9 18 11.5 16.6 9Z" fill="none" stroke="currentColor" strokeWidth={0.8} />
    <circle cx={18} cy={14.5} r={0.9} fill="currentColor" />
    <path d="M22.6 18.5A11 11 0 1 0 28.4 36.2 8.6 8.6 0 0 1 22.6 18.5Z" fill="currentColor" opacity={0.95} />
    <circle cx={30} cy={20} r={0.8} fill="currentColor" />
    <circle cx={6} cy={24} r={0.7} fill="currentColor" />
  </svg>
);

const Ornament: React.FC = () => (
  <div className="flex items-center justify-center gap-2 text-celestial-gold" aria-hidden="true">
    <span className="h-px w-12 bg-gradient-to-r from-transparent to-celestial-gold/70" />
    <TinyStar className="w-2 h-2" />
    <StarLine className="w-3 h-3" />
    <TinyStar className="w-2 h-2" />
    <span className="h-px w-12 bg-gradient-to-l from-transparent to-celestial-gold/70" />
  </div>
);

const GoogleGlyph: React.FC = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
);

/* ── Page ───────────────────────────────────────────────────────────── */

export const CelestialLogin: React.FC<CelestialLoginProps> = ({
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
  stageClassName = '',
  rootRef,
  onStagePointerDown,
  sceneDecor,
  frameBehind,
  frameFront,
}) => {
  const uid = useId();
  const [showPassword, setShowPassword] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // After a failed submit (not while typing), focus the first invalid field.
  useEffect(() => {
    if (!focusInvalidKey) return;
    if (errors.identifier) identifierRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusInvalidKey]);

  const idErr = `${uid}-identifier-error`;
  const pwErr = `${uid}-password-error`;

  return (
    <main
      ref={rootRef}
      data-part="celestial-login"
      className={`celestial-sky-bg relative min-h-[100dvh] overflow-hidden ${stageClassName}`}
      onPointerDown={onStagePointerDown}
    >
      <img
        data-part="sky"
        src={skyBackground}
        alt=""
        aria-hidden="true"
        className="celestial-sky select-none pointer-events-none"
      />

      {sceneDecor}

      <div className="relative flex min-h-[100dvh] items-center justify-center px-6 py-12">
        <div data-part="frame-box" className="relative w-[min(86vw,420px)]">
        {frameBehind}
        <div data-part="frame" className="celestial-frame relative z-10 w-full px-7 pt-14 pb-7">
          <ArchMoon />

          <header className="text-center">
            <h1 className="celestial-title text-[32px] leading-tight font-semibold tracking-[0.04em]">Uyn Thư Các</h1>
            <div className="mt-2.5">
              <Ornament />
            </div>
            <p className="mt-3 font-serif italic text-[15px] text-celestial-cream">Chào mừng nàng trở về khu vườn</p>
          </header>

          <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-5">
            <div>
              <label htmlFor={`${uid}-identifier`} className="celestial-label block">
                Email hoặc tên đăng nhập
              </label>
              <div className={`celestial-field ${errors.identifier ? 'has-error' : ''}`}>
                <MoonLine className="w-4 h-4 shrink-0 text-celestial-gold" />
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
                  aria-describedby={errors.identifier ? idErr : undefined}
                  className="celestial-input"
                />
              </div>
              {errors.identifier && (
                <p id={idErr} className="celestial-error mt-1.5">
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${uid}-password`} className="celestial-label block">
                Mật khẩu
              </label>
              <div className={`celestial-field ${errors.password ? 'has-error' : ''}`}>
                <StarLine className="w-4 h-4 shrink-0 text-celestial-gold" />
                <input
                  ref={passwordRef}
                  id={`${uid}-password`}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? pwErr : undefined}
                  className="celestial-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  className="celestial-focus shrink-0 -mr-1 p-1.5 rounded-full text-celestial-muted hover:text-celestial-gold-light cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id={pwErr} className="celestial-error mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            {errors.form && (
              <p role="alert" className="celestial-error celestial-error-banner">
                {errors.form}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 text-[13px]">
              <label className="flex items-center gap-2 text-celestial-muted cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => onRememberChange(e.target.checked)} className="peer sr-only" />
                <span className="celestial-check" aria-hidden="true">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="celestial-link celestial-focus rounded-sm">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" disabled={isLoading} aria-busy={isLoading} className="celestial-button celestial-focus mt-1">
              <TinyStar className="absolute left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-celestial-gold" />
              <span>{isLoading ? 'Đang mở cổng…' : 'Bước vào khu vườn'}</span>
              <TinyStar className="absolute right-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-celestial-gold" />
            </button>

            <div className="flex items-center gap-3 text-[12px] text-celestial-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-celestial-gold/30" />
              hoặc
              <span className="h-px flex-1 bg-celestial-gold/30" />
            </div>

            <div className="flex justify-center">
              <button type="button" onClick={onGoogle} className="celestial-ring celestial-focus w-10 h-10" aria-label="Đăng nhập bằng Google" title="Đăng nhập bằng Google">
                <GoogleGlyph />
              </button>
            </div>

            <p className="text-center text-[13px] text-celestial-muted">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="celestial-link is-gold celestial-focus rounded-sm">
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
        {frameFront}
        </div>
      </div>
    </main>
  );
};
