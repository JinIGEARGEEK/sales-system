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

  Object.keys(AllRules).forEach((rule) => {
    defineRule(rule, AllRules[rule])
  })

  defineRule('phone', (value: string) => {
    const regex = /\D/g
    const phoneNumber = value.replace(regex, '') || ''
    const pn = parsePhoneNumber(phoneNumber, { regionCode: 'TH' })
    return pn.valid
  })

  defineRule('id_card', (value: string) => {
    const idCard = value.replace(/\D/g, '')

    if (value.length !== 13) {
      return false
    }

    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(idCard.charAt(i)) * (13 - i)
    }
    const checkDigit = (11 - (sum % 11)) % 10

    return parseInt(idCard.charAt(12)) === checkDigit
  })
})

configure({
  generateMessage: localize({
    th: {
      messages: {
        ...th.messages,
        required: 'กรุณาระบุ {field}',
        phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
        id_card: 'รูปแบบบัตรประชาชนไม่ถูกต้อง',
      },
    },
    en: {
      messages: {
        ...en.messages,
        phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
        id_card: 'รูปแบบบัตรประชาชนไม่ถูกต้อง',
      },
    },
  }),
})
