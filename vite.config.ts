import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // index.html is Vite's entry point, so the app root is the directory holding it.
  root: 'src/web',
  publicDir: '../../public',
  build: { outDir: '../../dist', emptyOutDir: true },
  plugins: [react(), tailwindcss()],
  server: {
    // The frontend calls /api/... and never knows about ports. Anchored with a
    // trailing slash: a bare '/api' prefix also swallows sibling modules such as
    // src/web/api.ts, which the app root serves at /api.ts.
    proxy: { '^/api/': 'http://localhost:3000' },
  },
  test: {
    // Tests live outside the app root, so they resolve from the repo root instead.
    root: import.meta.dirname,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/{domain,api}/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['src/web/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/web/test-setup.ts'],
        },
      },
    ],
  },
});
