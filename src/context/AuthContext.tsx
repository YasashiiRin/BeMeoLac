import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { getCurrentUser } from '../services/userService';
import { authService, LoginResult } from '../services/authService';
import { getAuthToken, setAuthToken } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Throws AuthError('invalid_credentials') on wrong username/email or password. */
  login: (identifier: string, password: string, remember: boolean) => Promise<User>;
  /** Check credentials without starting the session (lets the UI play an entrance first). */
  authenticate: (identifier: string, password: string) => Promise<LoginResult>;
  /** Commit a session from authenticate(); public-only routes then redirect. */
  startSession: (result: LoginResult, remember: boolean) => void;
  /** Clears the session and goes to /login. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getAuthToken());

  // Restore a saved session (localStorage or sessionStorage) on startup.
  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((err) => {
        console.error('Failed to restore session', err);
        if (!cancelled) {
          setAuthToken(null);
          setTokenState(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback((identifier: string, password: string) => authService.login(identifier, password), []);

  const startSession = useCallback((result: LoginResult, remember: boolean) => {
    setAuthToken(result.token, remember);
    setTokenState(result.token);
    setUser(result.user);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, remember: boolean) => {
      const result = await authenticate(identifier, password);
      startSession(result, remember);
      return result.user;
    },
    [authenticate, startSession]
  );

  const logout = useCallback(() => {
    authService.logout().catch((err) => console.error('Logout failed', err));
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        authenticate,
        startSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
