import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // globals: true,
    testTimeout: 30000,
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

// import { defineConfig } from 'vitest/config'
// import Vue from '@vitejs/plugin-vue'

// export default defineConfig({
//   plugins: [Vue()],
//   test: {
//     globals: true,
//     // environment: 'nuxt',
//   },
// })
