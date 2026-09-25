import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthError, LoginResult } from '../../services/authService';
import { preloadRoute } from '../../routes/lazyPages';
import { redirectTarget } from '../../components/ProtectedRoute';
import { ForestBackground, ForegroundCorner } from '../../components/gate/ForestBackground';
import { FairyGate } from '../../components/gate/FairyGate';
import { ScrollForm, ScrollFormErrors } from '../../components/gate/ScrollForm';
import { CelestialLoginScene } from '../../features/login/CelestialLoginScene';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validate(identifier: string, password: string): ScrollFormErrors {
  const errors: ScrollFormErrors = {};
  const id = identifier.trim();
  if (!id) errors.identifier = 'Nàng nhập email hoặc tên đăng nhập nhé';
  else if (id.includes('@') && !EMAIL_RE.test(id)) errors.identifier = 'Email này chưa đúng định dạng rồi nàng ơi';
  if (!password) errors.password = 'Nàng nhập mật khẩu nhé';
  else if (password.length < MIN_PASSWORD) errors.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự`;
  return errors;
}

const DESKTOP_QUERY = '(min-width: 64rem)'; // Tailwind lg

function useIsDesktop() {
  const [matches, setMatches] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

/**
 * Login. One page, two scenes sharing the same state and auth logic:
 * - lg and up: "Cổng rừng tiên" — a leather scroll in front of the closed gate
 *   (every part is a separate element so it can be animated later).
 * - below lg: the night-sky artwork with a gold arched frame.
 * Only the active scene's form is rendered.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authenticate, startSession } = useAuth();
  const { showToast } = useToast();
  const isDesktop = useIsDesktop();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<ScrollFormErrors>({});
  const [focusInvalidKey, setFocusInvalidKey] = useState(0);
  const [deniedKey, setDeniedKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // mobile entrance: credentials accepted, session starts when the sequence ends
  const [successKey, setSuccessKey] = useState(0);
  const pendingSession = useRef<{ result: LoginResult; remember: boolean } | null>(null);

  const handleIdentifierChange = (v: string) => {
    setIdentifier(v);
    if (errors.identifier || errors.form) setErrors((e) => ({ ...e, identifier: undefined, form: undefined }));
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (errors.password || errors.form) setErrors((e) => ({ ...e, password: undefined, form: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || pendingSession.current) return;
    const found = validate(identifier, password);
    if (found.identifier || found.password) {
      setErrors(found);
      setFocusInvalidKey((k) => k + 1);
      return;
    }
    setErrors({});
    setIsLoading(true);
    const target = redirectTarget(location.state);
    try {
      if (!isDesktop) {
        // Night-sky scene: play the entrance first; the session (and the
        // redirect) start when it ends. Load the destination meanwhile.
        const result = await authenticate(identifier.trim(), password);
        pendingSession.current = { result, remember };
        preloadRoute(target);
        setSuccessKey(1);
        return; // stay "loading" until we leave the page
      }
      const user = await login(identifier.trim(), password, remember);
      showToast(`Chào mừng ${user.display_name} trở về khu vườn! 🌸`, 'success');
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === 'invalid_credentials') {
        setErrors({ form: 'Tên đăng nhập hoặc mật khẩu chưa đúng, nàng thử lại nhé' });
        setDeniedKey((k) => k + 1);
      } else {
        console.error('Login failed', err);
        showToast('Cổng chưa mở được, nàng thử lại sau nhé', 'error');
      }
      setIsLoading(false);
    }
  };

  const handleSuccessComplete = () => {
    const pending = pendingSession.current;
    if (!pending) return;
    // PublicOnlyRoute then redirects to the remembered page (default "/")
    startSession(pending.result, pending.remember);
    showToast(`Chào mừng ${pending.result.user.display_name} trở về khu vườn! 🌸`, 'success');
  };

  const handleGoogle = () => {
    showToast('Cổng Google sắp mở, nàng chờ thêm chút nhé ✿', 'info');
  };

  const formProps = {
    identifier,
    password,
    remember,
    isLoading,
    errors,
    focusInvalidKey,
    onIdentifierChange: handleIdentifierChange,
    onPasswordChange: handlePasswordChange,
    onRememberChange: setRemember,
    onSubmit: handleSubmit,
    onGoogle: handleGoogle,
  };

  if (!isDesktop) {
    return (
      <CelestialLoginScene {...formProps} deniedKey={deniedKey} successKey={successKey} onSuccessComplete={handleSuccessComplete} />
    );
  }

  return (
    <main data-theme="day" data-part="login-scene" className="relative min-h-[100dvh] overflow-hidden bg-scene-sky-bottom">
      <h1 className="sr-only">Uyên Thư Các — Đăng nhập</h1>
      <ForestBackground />

      <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-3 pt-4 pb-16 lg:py-6">
        {/* --gate-w drives both the gate size and how far the scroll overlaps it (below lg) */}
        <div data-part="stage" className="relative flex flex-col items-center [--gate-w:min(94vw,440px)] md:[--gate-w:min(76vw,540px)]">
          <FairyGate className="z-10 w-[var(--gate-w)] aspect-[600/820] lg:w-auto lg:h-[clamp(680px,94dvh,880px)]" />
          <div className="relative z-20 w-[min(84vw,400px)] md:w-[min(64vw,440px)] -mt-[calc(var(--gate-w)*0.84)] lg:mt-0 lg:w-auto lg:absolute lg:left-1/2 lg:top-[58%] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:[@media(max-height:820px)]:scale-[0.86]">
            <ScrollForm {...formProps} />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[15] pointer-events-none" aria-hidden="true">
        <ForegroundCorner side="left" />
        <ForegroundCorner side="right" />
      </div>
    </main>
  );
};
