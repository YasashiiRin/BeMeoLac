import { User } from '../types';
import { mockAccount, mockCurrentUser } from '../mocks/user';
import { simulateNetworkDelay } from './apiClient';
import { getCurrentUser } from './userService';

export type AuthErrorCode = 'invalid_credentials';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface LoginResult {
  token: string;
  user: User;
}

/**
 * Log in with a username or email + password.
 * Mock mode: only the default account in src/mocks/user.ts is accepted.
 */
export const login = async (identifier: string, password: string): Promise<LoginResult> => {
  await simulateNetworkDelay(450);
  const id = identifier.trim().toLowerCase();
  const matchesUser = id === mockAccount.username || id === mockCurrentUser.email.toLowerCase();
  if (!matchesUser || password !== mockAccount.password) {
    throw new AuthError('invalid_credentials', 'Tên đăng nhập hoặc mật khẩu chưa đúng');
  }
  const user = await getCurrentUser();
  return { token: `mock-token-${mockAccount.userId}-${Date.now()}`, user };
};

export const logout = async (): Promise<void> => {
  // Real API: revoke the token server-side. Nothing to do in mock mode.
};

export const authService = { login, logout };
