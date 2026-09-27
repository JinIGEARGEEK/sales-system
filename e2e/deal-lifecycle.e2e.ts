import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Deal lifecycle hand-offs: Mark Lost from the detail header sends the loss
// reason, Add Deal from a Contact pre-fills the create form, and a milestone
// payment schedule splits 30/40/30.
const STAGES = ['Discovery', 'Negotiation', 'Won', 'Lost'].map((name, i) => ({
  id: i + 1, name, sort_order: i, is_active: true, is_won_stage: name === 'Won', is_lost_stage: name === 'Lost', stale_days: null, created_at: null,
}))
const DEAL = {
  id: 31, title: 'Renewal Deal', value: 1000000, stage: 'Negotiation', status: 'open', company_id: 1, contact_id: 1,
  assigned_to: null, channel: 'Website', business_unit: null, business_unit_item: null, tags: [], position: 1,
  probability: 30, lost_reason: null, forecast_category: 'Pipeline', expected_close_date: null, created_at: new Date().toISOString(),
}
const COMPANY = { id: 1, name: 'Acme Co', industry: 'Tech', size: '', revenue_size: '', website: '', tags: [], notes: '', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
const CONTACT = { id: 1, name: 'Somchai', company_id: 1, role_title: '', email: '', phone: '', tags: [], is_primary: true, created_at: new Date().toISOString() }

test.describe('Deal lifecycle', () => {
  let stageMoves: Array<Record<string, unknown>>
  let installments: Array<Record<string, unknown>>

  test.beforeEach(async ({ page }) => {
    stageMoves = []
    installments = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /admin/pipeline-stages': route => json(route, STAGES),
      'GET /deals': route => json(route, [DEAL]),
      'GET /deals/31': route => json(route, DEAL),
      'GET /companies/1': route => json(route, COMPANY),
      'GET /contacts/1': route => json(route, CONTACT),
      'GET /contacts': route => json(route, [CONTACT]),
      'PATCH /deals/31/stage': async (route) => {
        const body = route.request().postDataJSON()
        stageMoves.push(body)
        await json(route, { ...DEAL, stage: body.stage, status: 'lost', lost_reason: body.lost_reason })
      },
      'POST /deals/31/payment-installments/bulk': async (route) => {
        installments.push(...route.request().postDataJSON().installments)
        await json(route, [])
      },
    })
  })

  test('Mark Lost on the deal header asks for a reason and sends it', async ({ page }) => {
    await page.goto('/crm/deals/31')
    await page.getByTestId('deal-mark-lost').click()
    const dialog = page.getByRole('dialog', { name: /Why was this deal lost/ })
    await expect(dialog).toBeVisible()

    await dialog.locator('[role="combobox"][data-cy="lost-reason-select"]').click()
    await page.getByRole('option', { name: 'Price' }).click()
    await dialog.getByRole('button', { name: 'Mark as Lost' }).click()
    await expect.poll(() => stageMoves.length).toBe(1)
    expect(stageMoves[0]).toMatchObject({ stage: 'Lost', lost_reason: 'price' })
  })

  test('Mark Won asks for confirmation first', async ({ page }) => {
    await page.goto('/crm/deals/31')
    await page.getByTestId('deal-mark-won').click()
    const dialog = page.getByRole('dialog', { name: 'Mark this deal as Won?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    expect(stageMoves).toHaveLength(0)
  })

  test('deal create pre-fills the contact from ?contact_id', async ({ page }) => {
    await page.goto('/crm/deals/create?contact_id=1&company_id=1')
    await expect(page.locator('[role="combobox"]').filter({ hasText: 'Somchai' })).toBeVisible()
  })

  test('a percentage split generates 30/40/30 installments', async ({ page }) => {
    await page.goto('/crm/deals/31/payments')
    await page.getByRole('button', { name: 'Generate Schedule' }).click()
    const dialog = page.getByRole('dialog', { name: 'Generate Payment Schedule' })
    await dialog.getByRole('button', { name: 'Split by percentage' }).click()
    await expect(dialog.getByTestId('milestone-amount-0')).toContainText('300,000.00')
    await expect(dialog.getByTestId('milestone-amount-1')).toContainText('400,000.00')
    await expect(dialog.getByTestId('milestone-percent-total')).toContainText('100%')

    await dialog.getByTestId('payment-schedule-save').click()
    await expect.poll(() => installments.length).toBe(3)
    expect(installments.map(i => i.amount)).toEqual([300000, 400000, 300000])
    expect(installments.map(i => i.note)).toEqual(['Deposit', 'Milestone 2', 'Final payment'])
  })
})
