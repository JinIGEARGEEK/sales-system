import { configure, defineRule, Form, Field, ErrorMessage } from 'vee-validate'
import AllRules from '@vee-validate/rules'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { localize, setLocale } from '@vee-validate/i18n'
import en from '@vee-validate/i18n/dist/locale/en.json'
import th from '@vee-validate/i18n/dist/locale/th.json'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Form', Form)
  nuxtApp.vueApp.component('Field', Field)
  nuxtApp.vueApp.component('ErrorMessage', ErrorMessage)

  setLocale(localStorage.getItem('lang') || 'th')

  Object.entries(AllRules).forEach(([rule, validator]) => {
    defineRule(rule, validator)
  })

  defineRule('phone', (value: string) => {
    const regex = /\D/g
    const phoneNumber = value.replace(regex, '') || ''
    const pn = parsePhoneNumber(phoneNumber, { regionCode: 'TH' })
    return pn.valid
  })

  // Thai tax ID: 13 digits with a valid check digit, dashes/spaces allowed.
  defineRule('tax_id', (value: string) => !value || isValidThaiTaxId(value))
})

configure({
  generateMessage: localize({
    th: {
      messages: {
        ...th.messages,
        required: 'กรุณาระบุ {field}',
        phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
        tax_id: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักที่ถูกต้อง',
      },
    },
    en: {
      messages: {
        ...en.messages,
        phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
        tax_id: 'Tax ID must be a valid 13-digit number',
      },
    },
  }),
})
