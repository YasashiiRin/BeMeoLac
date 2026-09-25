import { LoginResult } from '../types';
import * as mock from '../mocks/api/users';
import { USE_MOCK, getRefreshToken, request } from './http';

/* Auth — docs/api-contract.md#auth. Tokens are stored by http.setSession. */

/**
 * POST /api/auth/login body { username, password } → LoginResult
 * (username may also be the email); 401 invalid_credentials
 */
export const login = (identifier: string, password: string): Promise<LoginResult> =>
  USE_MOCK ? mock.login(identifier, password) : request('POST', '/api/auth/login', { body: { username: identifier, password }, auth: false });

/** POST /api/auth/logout body { refresh_token } → 204 (revokes this device's session) */
export const logout = async (): Promise<void> => {
  if (USE_MOCK) return;
  await request('POST', '/api/auth/logout', { body: { refresh_token: getRefreshToken() } });
};

// POST /api/auth/refresh body { refresh_token } → { access_token, refresh_token } — called by http.ts on 401.

export const authService = { login, logout };
