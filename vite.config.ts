import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
        },
      },
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['tests-unit/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      include: [
        'src/lib/server/**',
        'src/lib/utils/**',
        'src/lib/schemas/**',
        'src/routes/**/utils.server.ts',
        'src/routes/api/**/+server.ts',
        'src/routes/auth/callback/+server.ts',
        // The parens in the (authed) route group are escaped on purpose: picomatch
        // reads bare `(authed)` as a regex group and silently matches nothing, which
        // would un-gate these files. Keep the backslashes.
        'src/routes/\\(authed\\)/admin/games/add/+page.server.ts',
        'src/routes/\\(authed\\)/admin/seasons/+page.server.ts',
        'src/routes/\\(authed\\)/admin/seasons/add/+page.server.ts',
        'src/routes/\\(authed\\)/admin/scoring/+page.server.ts',
        'src/routes/\\(authed\\)/admin/sessions/add/+page.server.ts',
      ],
      exclude: [
        // Swept in by the schemas wildcard but not yet directly tested. Excluded so the
        // enforced margin reflects only intentionally-tested code and a future untested
        // schema can't silently erode it (see the plan's Coverage scope note).
        'src/lib/schemas/user/forgot-password.ts',
        'src/lib/schemas/user/reset-password.ts',
      ],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
})
