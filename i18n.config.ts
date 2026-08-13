import en from '~/locales/en'
import th from '~/locales/th'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    en,
    th,
  },
}))
