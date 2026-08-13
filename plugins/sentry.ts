import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: nuxtApp.$config.public.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: nuxtApp.$config.public.APP_ENV,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sentryError = (message: string, error: unknown|any) => {
    if (error?.response) {
      if (error?.response?.status >= 500) {
        const errorMessage = error?.response ? `${error?.response?.status}: ${error?.response?.data?.message}` : error
        Sentry.captureEvent({ message: `${message}: ${errorMessage}`, level: 'error' })
      }
    } else {
      Sentry.captureEvent({ message: `${message}: ${error}`, level: 'error' })
    }
  }

  return {
    provide: {
      sentryError,
    },
  }
})
