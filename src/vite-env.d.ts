/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin, e.g. https://api.example.com (paths start with /api). */
  readonly VITE_API_URL?: string;
  /** "false" calls the real API; anything else answers from src/mocks/api. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
