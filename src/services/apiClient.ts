/**
 * Base API Client configuration for Tủ Truyện Nhỏ
 * Pointing to FastAPI backend (VITE_API_URL) with fallback to mock data
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Session token. "Ghi nhớ đăng nhập" keeps it in localStorage (survives closing
// the browser); otherwise sessionStorage (ends with the tab).
const SESSION_KEY = 'tutruyen-session';

const readStore = (store: () => Storage): string | null => {
  try {
    return store().getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

let cachedToken: string | null = readStore(() => localStorage) ?? readStore(() => sessionStorage);

export const setAuthToken = (token: string | null, remember = true) => {
  cachedToken = token;
  for (const store of [() => localStorage, () => sessionStorage]) {
    try {
      store().removeItem(SESSION_KEY);
    } catch {
      // storage blocked — keep the in-memory token only
    }
  }
  if (!token) return;
  try {
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, token);
  } catch {
    // storage blocked — session lasts until reload
  }
};

export const getAuthToken = (): string | null => {
  return cachedToken;
};

/**
 * Small simulated delay to mimic real network latency in mock mode
 */
export const simulateNetworkDelay = async (ms: number = 200): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
