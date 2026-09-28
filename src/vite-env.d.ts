/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Services that call the real API, comma-separated (auth,users,comics,shelves,sources,tags,stats,notifications). Empty = all mock. */
  readonly VITE_REAL_SERVICES?: string;
  /** Global override: "true" = every service mock, "false" = every service real. Unset = follow VITE_REAL_SERVICES. */
  readonly VITE_USE_MOCK?: string;
  /** Backend origin, e.g. https://api.example.com. Empty = same origin (/api, proxied by the Vite dev server). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
