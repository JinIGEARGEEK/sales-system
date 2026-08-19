import * as Sentry from '@sentry/vue'
import { isAxiosError } from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: nuxtApp.$config.public.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: nuxtApp.$config.public.APP_ENV,
  })

  const sentryError = (message: string, error: unknown) => {
    if (isAxiosError(error) && error.response) {
      if (error.response.status >= 500) {
        const errorMessage = `${error.response.status}: ${error.response.data?.message}`
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
