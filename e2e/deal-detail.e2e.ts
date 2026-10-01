import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Deal detail: the value reads with thousands separators, unsaved edits ask
// through the styled leave-confirm modal before switching tabs, and a
// hard-to-reverse contract status change is confirmed first (cancelling
// sends nothing). Signed only comes from uploading the signed document, and
// a signed contract is shown locked.
const STAGES = ['Discovery', 'Negotiation', 'Won', 'Lost'].map((name, i) => ({
  id: i + 1, name, sort_order: i, is_active: true, is_won_stage: name === 'Won', is_lost_stage: name === 'Lost', stale_days: null, created_at: null,
}))
const DEAL = {
  id: 31, title: 'Renewal Deal', value: 500000, stage: 'Negotiation', status: 'open', company_id: 1, contact_id: 1,
  assigned_to: null, channel: 'Website', business_unit: null, business_unit_item: null, tags: [], position: 1,
  probability: 30, lost_reason: null, forecast_category: 'Pipeline', expected_close_date: null, created_at: new Date().toISOString(),
}
const COMPANY = { id: 1, name: '', industry: 'Tech', size: '', revenue_size: '', website: '', tags: [], notes: '', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
const CONTACT = { id: 1, name: 'Somchai', company_id: 1, role_title: '', email: '', phone: '', tags: [], is_primary: true, created_at: new Date().toISOString() }
const CONTRACT = { id: 5, deal_id: 31, quote_id: null, status: 'draft', signed_file_url: null, signed_date: null, end_date: null, created_at: new Date().toISOString() }
const SIGNED_CONTRACT = {
  id: 6, deal_id: 31, quote_id: null, status: 'signed', effective_status: 'signed', signed_file_url: '/uploads/signed.pdf',
  signed_date: new Date().toISOString(), end_date: '2027-12-31', created_at: new Date().toISOString(),
}
// Signed, but past its end date: still signed (and locked), shown Expired.
const LAPSED_CONTRACT = { ...SIGNED_CONTRACT, id: 7, effective_status: 'expired', end_date: '2026-01-31' }

test.describe('Deal detail', () => {
  let contractPuts: Array<Record<string, unknown>>

  test.beforeEach(async ({ page }) => {
    contractPuts = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /admin/pipeline-stages': route => json(route, STAGES),
      'GET /deals': route => json(route, [DEAL]),
      'GET /deals/31': route => json(route, DEAL),
      'GET /companies/1': route => json(route, COMPANY),
      'GET /contacts/1': route => json(route, CONTACT),
      'GET /deals/31/contracts': route => json(route, [CONTRACT, SIGNED_CONTRACT, LAPSED_CONTRACT]),
      'PUT /contracts/5': async (route) => {
        contractPuts.push(route.request().postDataJSON())
        await json(route, { ...CONTRACT, ...route.request().postDataJSON() })
      },
    })
  })

  test('shows the value with separators and a placeholder for a blank company name', async ({ page }) => {
    await page.goto('/crm/deals/31')
    await expect(page.getByTestId('deal-value-input')).toHaveValue('500,000')
    await expect(page.getByText('(Unnamed company)')).toBeVisible()
  })

  test('unsaved edits ask before switching tabs', async ({ page }) => {
    await page.goto('/crm/deals/31')
    const title = page.locator('input[name="title"]')
    await expect(title).toHaveValue('Renewal Deal')
    await title.fill('Renewal Deal v2')

    await page.getByRole('tab', { name: 'Contracts' }).click()
    const dialog = page.getByRole('dialog', { name: 'Discard unsaved changes?' })
    await expect(dialog).toBeVisible()
    await dialog.getByTestId('leave-confirm-stay').click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/crm\/deals\/31$/)
    await expect(title).toHaveValue('Renewal Deal v2')

    await page.getByRole('tab', { name: 'Contracts' }).click()
    await page.getByRole('dialog', { name: 'Discard unsaved changes?' }).getByTestId('leave-confirm-leave').click()
    await expect(page).toHaveURL(/\/crm\/deals\/31\/contracts$/)
  })

  test('Signed isn\'t offered; marking Expired is confirmed first and cancelling sends nothing', async ({ page }) => {
    await page.goto('/crm/deals/31/contracts')
    const select = page.locator('[role="combobox"][data-cy="contract-status-5"]')
    await expect(select).toContainText('Draft')

    await select.click()
    await expect(page.getByRole('option', { name: 'Signed' })).toHaveCount(0)
    await page.getByRole('option', { name: 'Expired' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Change contract status?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('[role="combobox"][data-cy="contract-status-5"]')).toContainText('Draft')
    expect(contractPuts).toHaveLength(0)

    await page.locator('[role="combobox"][data-cy="contract-status-5"]').click()
    await page.getByRole('option', { name: 'Expired' }).click()
    await page.getByRole('dialog').filter({ hasText: 'Change contract status?' }).getByRole('button', { name: 'Change status' }).click()
    await expect.poll(() => contractPuts).toEqual([{ status: 'expired' }])
  })

  test('a signed contract is locked, and uploading without an end date asks to set one first', async ({ page }) => {
    await page.goto('/crm/deals/31/contracts')
    // Signed: a badge (no select), no edit or upload, and the lock explained.
    await expect(page.locator('[role="combobox"][data-cy="contract-status-6"]')).toHaveCount(0)
    await expect(page.getByTestId('contract-locked-6')).toBeVisible()
    await expect(page.getByTestId('contract-edit-6')).toHaveCount(0)
    // A lapsed one reads Signed (locked) with Expired beside it — once.
    await expect(page.getByTestId('contract-status-7')).toHaveText('Signed')
    await expect(page.getByTestId('contract-effective-status-7')).toHaveText('Expired')

    await page.getByTestId('contract-upload-5').click()
    const prompt = page.getByRole('dialog', { name: 'Set the end date first?' })
    await expect(prompt).toBeVisible()
    await prompt.getByTestId('contract-set-end-date').click()
    await expect(page.getByRole('dialog', { name: 'Edit Contract' })).toBeVisible()
  })
})
