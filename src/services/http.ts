/**
 * HTTP client for the FastAPI backend (docs/api-contract.md).
 *
 * - VITE_USE_MOCK !== "false" → services answer from src/mocks/api (no network).
 * - VITE_API_URL is the backend origin; every path starts with /api.
 * - Requests carry "Authorization: Bearer <access token>". On a 401 the client
 *   refreshes the token once (POST /api/auth/refresh) and retries; if that
 *   fails the session is cleared and the app goes to /login.
 * - Every error is an ApiError built from the backend body { detail, code? }.
 */

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/** The one error type services throw (mock and real). */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, detail: string, code?: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  get detail() {
    return this.message;
  }
}

export const isApiError = (err: unknown, code?: string): err is ApiError =>
  err instanceof ApiError && (code === undefined || err.code === code);

/* ── Session tokens ─────────────────────────────────────────────────── */

// "Ghi nhớ đăng nhập" keeps tokens in localStorage (survive closing the
// browser); otherwise sessionStorage (end with the tab).
const ACCESS_KEY = 'tutruyen-session';
const REFRESH_KEY = 'tutruyen-refresh';
const stores = [() => localStorage, () => sessionStorage];

const read = (key: string): string | null => {
  for (const store of stores) {
    try {
      const v = store().getItem(key);
      if (v) return v;
    } catch {
      // storage blocked
    }
  }
  return null;
};

let accessToken: string | null = read(ACCESS_KEY);
let refreshToken: string | null = read(REFRESH_KEY);
let remembered = (() => {
  try {
    return !!localStorage.getItem(ACCESS_KEY) || !sessionStorage.getItem(ACCESS_KEY);
  } catch {
    return true;
  }
})();

export interface SessionTokens {
  access_token: string;
  refresh_token?: string | null;
}

/** Save (or clear, with null) the session tokens. */
export function setSession(tokens: SessionTokens | null, remember = remembered): void {
  remembered = remember;
  accessToken = tokens?.access_token ?? null;
  refreshToken = tokens ? tokens.refresh_token ?? refreshToken : null;
  for (const store of stores) {
    try {
      store().removeItem(ACCESS_KEY);
      store().removeItem(REFRESH_KEY);
    } catch {
      // storage blocked — keep the in-memory tokens only
    }
  }
  if (!accessToken) return;
  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) store.setItem(REFRESH_KEY, refreshToken);
  } catch {
    // storage blocked — session lasts until reload
  }
}

export const getAccessToken = (): string | null => accessToken;
export const getRefreshToken = (): string | null => refreshToken;

/** AuthContext registers what happens when the session can't be renewed. */
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

/* ── Requests ───────────────────────────────────────────────────────── */

export type QueryValue = string | number | boolean | null | undefined | (string | number)[];
export type Query = Record<string, QueryValue>;

interface RequestOptions {
  query?: Query;
  /** JSON-serialised unless it is FormData */
  body?: unknown;
  /** send the Bearer token and handle 401 (default true) */
  auth?: boolean;
  /** return the raw Response (file downloads) */
  raw?: boolean;
}

/** Skips empty values; arrays become repeated keys (?status=a&status=b). */
export function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  }
  const qs = params.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText || 'Đã có lỗi xảy ra';
  let code: string | undefined;
  try {
    const body = await res.json();
    if (typeof body?.detail === 'string') detail = body.detail;
    // FastAPI validation errors: [{ msg, loc }]
    else if (Array.isArray(body?.detail)) {
      detail = body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') || detail;
      code = 'validation_error';
    }
    if (typeof body?.code === 'string') code = body.code;
  } catch {
    // not JSON
  }
  return new ApiError(res.status, detail, code);
}

// one refresh at a time; concurrent 401s wait for the same attempt
let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  if (!refreshToken) return Promise.resolve(false);
  refreshing ??= fetch(buildUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return false;
      const tokens = (await res.json()) as SessionTokens;
      setSession(tokens);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(method: string, path: string, opts: RequestOptions, retried = false): Promise<Response> {
  const { query, body, auth = true } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ, nàng kiểm tra mạng rồi thử lại nhé', 'network_error');
  }

  if (res.status === 401 && auth) {
    if (!retried && (await refreshSession())) return send(method, path, opts, true);
    setSession(null);
    onUnauthorized();
    throw await toApiError(res);
  }
  if (!res.ok) throw await toApiError(res);
  return res;
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(method, path, opts);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** For downloads: the raw Response. */
export const requestRaw = (method: string, path: string, opts: RequestOptions = {}) => send(method, path, { ...opts, raw: true });

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, { body, query }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

/** null instead of throwing when the resource is missing (404). */
export async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

/** Mock mode: a small pause so loading states show like on a real network. */
export const simulateNetworkDelay = (ms = 200): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
