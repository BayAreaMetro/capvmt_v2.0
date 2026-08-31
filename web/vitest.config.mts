import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Scoped to test/unit only - test/*.spec.ts are Playwright e2e specs
// (see playwright.config.ts's explicit testMatch), a separate runner
// that vitest must not try to collect. The alias mirrors tsconfig.json's
// "@/*" path mapping, which vitest doesn't read on its own.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    include: ['test/unit/**/*.test.ts'],
  },
});
