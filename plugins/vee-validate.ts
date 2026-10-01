import { configure, defineRule, Form, Field, ErrorMessage } from 'vee-validate'
// 4.15 dropped the default export; `all` is the same name → rule map.
import { all as AllRules } from '@vee-validate/rules'
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

  // An amount above zero. A `thousands` InputText hands the validator its
  // formatted text ("250,000"), which min_value reads as NaN — strip the
  // separators first.
  defineRule('positive_amount', (value: unknown) => Number(String(value ?? '').replace(/,/g, '')) > 0)
})

configure({
  generateMessage: localize({
    th: {
      messages: {
        ...th.messages,
        required: 'กรุณาระบุ {field}',
        phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
        tax_id: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักที่ถูกต้อง',
        positive_amount: '{field} ต้องมากกว่า 0',
      },
    },
    en: {
      messages: {
        ...en.messages,
        phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
        tax_id: 'Tax ID must be a valid 13-digit number',
        positive_amount: '{field} must be more than 0',
      },
    },
  }),
})
