import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET (not VITE_-prefixed: the dev server reads it, the browser never sees it)
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Local dev: the app calls /api/... on its own origin, as in production, and Vite
      // forwards it to the FastAPI backend (no CORS). Used when VITE_API_URL is empty.
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true },
      },
    },
  };
});
