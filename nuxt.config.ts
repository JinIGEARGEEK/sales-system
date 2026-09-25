// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: {
    public: {
      API_URL: process.env.API_URL,
      // Read by plugins/sentry.ts. Declaring them here (even with an empty
      // default) is required for Nuxt to expose them on $config.public at
      // all — an undeclared key isn't just "unset", it's absent from the
      // typed config object entirely, so Sentry.init() previously always
      // ran with `dsn: undefined` (silently disabling error reporting) no
      // matter what the deploy environment actually set.
      SENTRY_DSN: process.env.SENTRY_DSN || '',
      APP_ENV: process.env.APP_ENV || 'development',
    },
  },

  components: {
    dirs: [
      '~/components',
    ],
  },

  imports: {
    dirs: ['stores', 'composables/**'],
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'th',
      },
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    '@nuxt/test-utils/module',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  // Icons are served from this app's own Nitro server (`/api/_nuxt_icon`)
  // out of the locally installed `@iconify-json/material-symbols` package —
  // never fetched from api.iconify.design at runtime. Icons statically
  // referenced in components are additionally inlined into the client
  // bundle (`clientBundle.scan`), so most never hit the network at all.
  // Nuxt UI's built-in icons are remapped to Material Symbols in
  // app.config.ts (`ui.icons`), so no Lucide collection is needed.
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['material-symbols'],
    },
    fallbackToApi: false,
    clientBundle: {
      scan: {
        globInclude: ['components/**/*.vue', 'pages/**/*.vue', 'layouts/**/*.vue', 'app.vue', 'app.config.ts', 'constants/**/*.ts'],
      },
      sizeLimitKb: 512,
    },
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'sales-system-color-mode',
  },

  css: [
    'assets/styles/global.css',
    'assets/styles/typography.css',
  ],

  build: {
    transpile: ['@vee-validate/rules'],
  },

  vite: {
    plugins: [],
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  i18n: {
    restructureDir: '.',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
    defaultLocale: 'th',
    // No route in this app is locale-prefixed (no `/en/...` links/menus
    // anywhere) — without an explicit strategy, `@nuxtjs/i18n` defaults to
    // `prefix_except_default`, whose global route middleware re-derives the
    // active locale from the (always-unprefixed) URL on every navigation,
    // silently resetting a manually-switched locale back to `defaultLocale`
    // on the very next page change. `no_prefix` skips that route-based
    // detection entirely, so the locale set via `setLocale()` (see
    // components/SwitchLang.vue) actually persists across navigation.
    strategy: 'no_prefix',
    locales: [
      {
        code: 'en',
        language: 'en-US',
      },
      {
        code: 'th',
        language: 'th-TH',
      },
    ],
  },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-03-05',
})
