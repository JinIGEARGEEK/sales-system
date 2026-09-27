import { describe, it, expect } from 'vitest'

describe('notificationAlertPath', () => {
  it('opens the Deal tab the alert is about', () => {
    expect(notificationAlertPath({ entity_type: 'payment_installment', deal_id: 4 })).toBe('/crm/deals/4/payments')
    expect(notificationAlertPath({ entity_type: 'contract_expiry', deal_id: 4 })).toBe('/crm/deals/4/contracts')
    expect(notificationAlertPath({ entity_type: 'contract', deal_id: 4 })).toBe('/crm/deals/4/contracts')
    expect(notificationAlertPath({ entity_type: 'quote', deal_id: 4 })).toBe('/crm/deals/4/quotes')
    expect(notificationAlertPath({ entity_type: 'deal', deal_id: 4 })).toBe('/crm/deals/4')
  })

  it('opens the Company\'s Products tab for a renewal, the Company otherwise', () => {
    expect(notificationAlertPath({ entity_type: 'customer_product_renewal', company_id: 9 })).toBe('/crm/companies/9?tab=products')
    expect(notificationAlertPath({ entity_type: 'company', company_id: 9 })).toBe('/crm/companies/9')
  })

  it('falls back to the Prospect, or null when nothing resolved', () => {
    expect(notificationAlertPath({ entity_type: 'prospect', prospect_id: 2 })).toBe('/crm/prospects/2')
    expect(notificationAlertPath({ entity_type: 'deal' })).toBeNull()
  })
})

describe('notificationAlertDate', () => {
  it('reads the date-based rules\' YYYY-MM-DD context only', () => {
    expect(notificationAlertDate({ entity_type: 'customer_product_renewal', context: '2027-01-15' })).toBe('2027-01-15')
    expect(notificationAlertDate({ entity_type: 'contract_expiry', context: '2027-03-31' })).toBe('2027-03-31')
    expect(notificationAlertDate({ entity_type: 'deal', context: 'Negotiation' })).toBeNull()
    expect(notificationAlertDate({ entity_type: 'contract_expiry', context: undefined })).toBeNull()
  })
})

describe('NOTIFICATION_ENTITY_TYPES', () => {
  it('covers every entity type, including the 2026-09-27 date-based ones', () => {
    expect(NOTIFICATION_ENTITY_TYPES).toEqual(expect.arrayContaining(['payment_installment', 'customer_product_renewal', 'contract_expiry']))
    expect(NOTIFICATION_ENTITY_TYPES).toHaveLength(8)
  })
})
