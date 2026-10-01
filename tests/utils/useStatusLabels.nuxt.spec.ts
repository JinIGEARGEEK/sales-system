import { describe, it, expect, beforeAll, afterEach } from 'vitest'

// The status-label half of the use*StatusColor composables: every badge,
// select option and table cell reads its text from `global.status.*` instead
// of printing the raw API enum value.
describe('status labels', () => {
  // The Nuxt app boots in a beforeAll (@nuxt/test-utils 4), so it isn't
  // there yet while this describe body is collected.
  let i18n: ReturnType<typeof useNuxtApp>['$i18n']
  let initialLocale: typeof i18n.locale.value
  beforeAll(() => {
    i18n = useNuxtApp().$i18n
    initialLocale = i18n.locale.value
  })

  afterEach(async () => {
    await i18n.setLocale(initialLocale)
  })

  it('labels every Quote status, including the derived "expired"', async () => {
    await i18n.setLocale('en')
    const { quoteStatusLabel } = useQuoteStatusColor()
    expect(quoteStatusLabel('draft')).toBe('Draft')
    expect(quoteStatusLabel('accepted')).toBe('Accepted')
    expect(quoteStatusLabel('expired')).toBe('Expired')
  })

  it('offers only the user-settable Quote statuses as options', async () => {
    await i18n.setLocale('en')
    const { quoteStatusOptions } = useQuoteStatusColor()
    expect(quoteStatusOptions.value.map(o => o.value)).toEqual(['draft', 'sent', 'accepted', 'rejected'])
    expect(quoteStatusOptions.value[0]).toEqual({ value: 'draft', label: 'Draft' })
  })

  it('translates labels in Thai and follows a live locale switch', async () => {
    const { contractStatusLabel, contractStatusOptions } = useContractStatusColor()
    await i18n.setLocale('en')
    expect(contractStatusLabel('signed')).toBe('Signed')
    expect(contractStatusOptions.value.find(o => o.value === 'signed')?.label).toBe('Signed')
    await i18n.setLocale('th')
    expect(contractStatusLabel('signed')).toBe('ลงนามแล้ว')
    expect(contractStatusOptions.value.find(o => o.value === 'signed')?.label).toBe('ลงนามแล้ว')
  })

  it('maps Title Case project / customer-product values onto their locale keys', async () => {
    await i18n.setLocale('th')
    const { projectStatusLabel, projectStatusOptions } = useProjectStatusColor()
    const { customerProductStatusLabel } = useCustomerProductStatusColor()
    expect(projectStatusLabel('In Progress')).toBe('กำลังดำเนินการ')
    expect(projectStatusOptions.value.map(o => o.value)).toEqual(['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'])
    expect(customerProductStatusLabel('Churned')).toBe('เลิกใช้')
  })

  it('falls back to the raw value for a status the frontend has no label for', () => {
    const { projectStatusLabel } = useProjectStatusColor()
    expect(projectStatusLabel('Archived' as ProjectStatus)).toBe('Archived')
    expect(statusLabelFromGroup('quote', 'superseded')).toBe('superseded')
  })
})

describe('activeStatusColor / useActiveStatusBadge', () => {
  it('colours an active record success and an inactive one neutral', () => {
    expect(activeStatusColor(true)).toBe('success')
    expect(activeStatusColor(false)).toBe('neutral')
  })

  it('builds a TableData status badge with the matching per-entity label', () => {
    const { activeBadge } = useActiveStatusBadge()
    expect(activeBadge(true, 'Active', 'Archived')).toEqual({ title: 'Active', color: 'success', isNoData: false })
    expect(activeBadge(false, 'Active', 'Revoked')).toEqual({ title: 'Revoked', color: 'neutral', isNoData: false })
  })
})
