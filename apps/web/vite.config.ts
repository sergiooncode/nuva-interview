import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    // The frontend calls /api/... and never knows about ports. Anchored with a
    // trailing slash: a bare '/api' prefix also swallows sibling modules such as
    // src/api.ts, which the app root serves at /src/api.ts.
    proxy: { '^/api/': process.env.API_ORIGIN ?? 'http://localhost:3000' },
  },
});
