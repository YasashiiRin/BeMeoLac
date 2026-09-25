import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthError, LoginResult } from '../../services/authService';
import { preloadRoute } from '../../routes/lazyPages';
import { redirectTarget } from '../../components/ProtectedRoute';
import type { LoginFormErrors } from '../../components/celestial/CelestialLogin';
import { CelestialLoginScene } from '../../features/login/CelestialLoginScene';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validate(identifier: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const id = identifier.trim();
  if (!id) errors.identifier = 'Nàng nhập email hoặc tên đăng nhập nhé';
  else if (id.includes('@') && !EMAIL_RE.test(id)) errors.identifier = 'Email này chưa đúng định dạng rồi nàng ơi';
  if (!password) errors.password = 'Nàng nhập mật khẩu nhé';
  else if (password.length < MIN_PASSWORD) errors.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự`;
  return errors;
}

/**
 * Login: the night-sky scene with a gold arched frame, at every width.
 * On success the celestial entrance plays, then the session starts.
 */
export const LoginPage: React.FC = () => {
  const location = useLocation();
  const { authenticate, startSession } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [focusInvalidKey, setFocusInvalidKey] = useState(0);
  const [deniedKey, setDeniedKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // credentials accepted → the entrance plays → the session starts when it ends
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
      // Play the entrance first; the session (and the redirect) start when it
      // ends. Load the destination meanwhile.
      const result = await authenticate(identifier.trim(), password);
      pendingSession.current = { result, remember };
      preloadRoute(target);
      setSuccessKey(1);
      // stay "loading" until we leave the page
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

  return <CelestialLoginScene {...formProps} deniedKey={deniedKey} successKey={successKey} onSuccessComplete={handleSuccessComplete} />;
};
