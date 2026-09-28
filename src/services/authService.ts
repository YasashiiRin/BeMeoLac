import { LoginResult } from '../types';
import * as mock from '../mocks/api/users';
import { isMock, getRefreshToken, request } from './http';

const MOCK = isMock('auth');

/* Auth — docs/api-contract.md#auth. Tokens are stored by http.setSession. */

/**
 * POST /api/auth/login body { username, password } → LoginResult { access_token, refresh_token, token_type: "bearer", user }
 * (username may also be the email); 401 invalid_credentials, 403 account_locked
 */
export const login = (identifier: string, password: string): Promise<LoginResult> =>
  MOCK ? mock.login(identifier, password) : request('POST', '/api/auth/login', { body: { username: identifier, password }, auth: false });

/** POST /api/auth/logout body { refresh_token } → 204 (revokes this device's session) */
export const logout = async (): Promise<void> => {
  if (MOCK) return;
  await request('POST', '/api/auth/logout', { body: { refresh_token: getRefreshToken() } });
};

// POST /api/auth/refresh body { refresh_token } → { access_token, token_type, refresh_token? } — called by http.ts on 401.
// The backend doesn't rotate the refresh token, so the client keeps the one it has.

export const authService = { login, logout };
