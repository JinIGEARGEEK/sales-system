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

  icon: {
    provider: 'iconify',
    collections: ['material-symbols'],
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
