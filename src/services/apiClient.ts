/**
 * Base API Client configuration for Tủ Truyện Nhỏ
 * Pointing to FastAPI backend (VITE_API_URL) with fallback to mock data
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// In-memory token storage for mock auth
let inMemoryAuthToken: string | null = 'mock-fairytale-jwt-token-2024';

export const setAuthToken = (token: string | null) => {
  inMemoryAuthToken = token;
};

export const getAuthToken = (): string | null => {
  return inMemoryAuthToken;
};

/**
 * Small simulated delay to mimic real network latency in mock mode
 */
export const simulateNetworkDelay = async (ms: number = 200): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
