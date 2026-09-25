import React from 'react';
import { Location, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SessionLoading: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center" role="status">
    <span className="text-3xl animate-bounce" aria-hidden="true">🌸</span>
    <span className="font-serif text-sm text-text-muted mt-3">Đang mở tủ truyện...</span>
  </div>
);

/**
 * Guards app routes: without a session, redirect to /login and remember the
 * page the user wanted (state.from). Use as a layout route or with children.
 */
export const ProtectedRoute: React.FC<{ children?: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SessionLoading />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children ?? <Outlet />;
};

/** Page the guard remembered in state.from (path + query + hash), default "/". */
export function redirectTarget(state: unknown): string {
  const from = (state as { from?: Location } | null)?.from;
  if (!from?.pathname || from.pathname === '/login') return '/';
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

/**
 * For /login: a logged-in user goes to the page they wanted, or "/".
 * This also performs the redirect right after a successful login.
 */
export const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <SessionLoading />;
  if (isAuthenticated) return <Navigate to={redirectTarget(location.state)} replace />;
  return children;
};
