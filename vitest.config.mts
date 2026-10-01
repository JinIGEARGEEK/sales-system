import { fileURLToPath } from 'node:url'
import { configDefaults } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // globals: true,
    testTimeout: 30000,
    // Each file boots the Nuxt app in a beforeAll (@nuxt/test-utils 4); with
    // every worker booting at once that can outlast Vitest's 10s default.
    hookTimeout: 60000,
    // Agent worktrees under .claude/ are full checkouts of other branches
    exclude: [...configDefaults.exclude, '.claude/**'],
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./', import.meta.url)),
        domEnvironment: 'happy-dom', // 'happy-dom' (default) or 'jsdom'
        overrides: {
          // other Nuxt config you want to pass
        },
        mock: {
          intersectionObserver: true,
          indexedDb: true,
        },
      },
    },
  },
})
