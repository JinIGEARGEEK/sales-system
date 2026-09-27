import { useI18n } from 'vue-i18n'

// entity_type values are snake_case; their i18n keys are camelCase
// (admin.pipelineConfig.notificationRules.entityTypeOptions.* / entityTypeHelp.*).
export const NOTIFICATION_ENTITY_TYPE_KEY: Record<NotificationEntityType, string> = {
  deal: 'deal',
  quote: 'quote',
  contract: 'contract',
  prospect: 'prospect',
  company: 'company',
  payment_installment: 'paymentInstallment',
  customer_product_renewal: 'customerProductRenewal',
  contract_expiry: 'contractExpiry',
}

export const NOTIFICATION_ENTITY_TYPES = Object.keys(NOTIFICATION_ENTITY_TYPE_KEY) as NotificationEntityType[]

export const useNotificationEntityType = () => {
  const { t, te } = useI18n()
  const keyOf = (type: string) => NOTIFICATION_ENTITY_TYPE_KEY[type as NotificationEntityType] ?? type
  const entityTypeLabel = (type: string) => {
    const key = `admin.pipelineConfig.notificationRules.entityTypeOptions.${keyOf(type)}`
    return te(key) ? t(key) : type
  }
  const entityTypeHelp = (type: string) => {
    const key = `admin.pipelineConfig.notificationRules.entityTypeHelp.${keyOf(type)}`
    return te(key) ? t(key) : ''
  }
  return { entityTypeLabel, entityTypeHelp }
}

type AlertLinkFields = Pick<NotificationFiring, 'entity_type' | 'deal_id' | 'company_id' | 'prospect_id'>

// Where a Recent Alerts row opens: the Deal tab the alert is about (payments
// for an installment, contracts for an unsigned/ending contract, quotes for
// an expiring quote), the Company's Products tab for a renewal, else the
// record itself. null when the firing resolved to nothing linkable.
export const notificationAlertPath = (alert: AlertLinkFields): string | null => {
  if (alert.deal_id) {
    const base = `/crm/deals/${alert.deal_id}`
    if (alert.entity_type === 'payment_installment') return `${base}/payments`
    if (alert.entity_type === 'contract' || alert.entity_type === 'contract_expiry') return `${base}/contracts`
    if (alert.entity_type === 'quote') return `${base}/quotes`
    return base
  }
  if (alert.company_id) {
    return alert.entity_type === 'customer_product_renewal'
      ? `/crm/companies/${alert.company_id}?tab=products`
      : `/crm/companies/${alert.company_id}`
  }
  if (alert.prospect_id) return `/crm/prospects/${alert.prospect_id}`
  return null
}

// The date a date-based firing is about (renewal date, contract end date),
// from its dedupe context — 'YYYY-MM-DD', or null for stage/tier contexts.
export const notificationAlertDate = (alert: Pick<NotificationFiring, 'entity_type' | 'context'>): string | null =>
  alert.entity_type === 'customer_product_renewal' || alert.entity_type === 'contract_expiry'
    ? toDateOnly(alert.context)
    : null
