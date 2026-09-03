import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * One suite across the whole workspace. The node project covers every package;
 * the web project is the only one needing a DOM, so it carries the jsdom cost alone.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/**/*.test.ts', 'apps/api/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['apps/web/**/*.test.{ts,tsx}'],
          setupFiles: ['./apps/web/src/test-setup.ts'],
        },
      },
    ],
  },
});
