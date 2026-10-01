import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Merge duplicates (a Contact's detail page, and the Companies list's bulk
// Merge) and the Deal value that follows its Accepted quote.
const now = new Date().toISOString()
const contact = (id: number, name: string, email: string) => ({
  id, name, company_id: 1, role_title: '', email, phone: '', tags: [], status: 'active', is_primary: id === 5, created_at: now,
})
const company = (id: number, name: string) => ({
  id, name, industry: 'Tech', size: '', revenue_size: '', website: '', tags: [], notes: '', status: 'active', created_at: now, updated_at: now,
})
const STAGES = ['Discovery', 'Negotiation', 'Won', 'Lost'].map((name, i) => ({
  id: i + 1, name, sort_order: i, is_active: true, is_won_stage: name === 'Won', is_lost_stage: name === 'Lost', stale_days: null, created_at: null,
}))

test.describe('Merge duplicates', () => {
  test('merges a searched-for duplicate into this contact and reports the result', async ({ page }) => {
    const mergeBodies: unknown[] = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /contacts/5': route => json(route, contact(5, 'Somchai Jaidee', 'somchai@example.com')),
      'GET /companies/1': route => json(route, company(1, 'Acme')),
      'GET /contacts': (route, url) => json(route, url.searchParams.get('search')
        ? [contact(5, 'Somchai Jaidee', 'somchai@example.com'), contact(9, 'Somchai J.', 'somchai.j@example.com')]
        : []),
      'POST /contacts/5/merge': async (route) => {
        mergeBodies.push(route.request().postDataJSON())
        await json(route, {
          target: { ...contact(5, 'Somchai Jaidee', 'somchai@example.com'), phone: '0812345678' },
          moved: { deals: 2, activities: 4, tasks: 1, lead_referrals: 0, total: 7 },
          filled: ['phone'],
          conflicts: [{ field: 'email', source_id: 9, value: 'somchai.j@example.com' }],
        })
      },
    })

    await page.goto('/crm/contacts/5')
    await page.getByTestId('contact-merge-open').click()
    const dialog = page.getByRole('dialog', { name: 'Merge duplicate contacts' })
    await expect(dialog.getByTestId('merge-survivor')).toContainText('Somchai Jaidee')
    await expect(dialog.getByTestId('merge-next')).toBeDisabled()

    await dialog.getByTestId('merge-search').fill('somchai')
    // This contact itself is never offered.
    await expect(dialog.getByTestId('merge-result-9')).toBeVisible()
    await expect(dialog.getByTestId('merge-result-5')).toHaveCount(0)
    await dialog.getByTestId('merge-result-9').click()
    await expect(dialog.getByTestId('merge-source-9')).toContainText('Somchai J.')

    await dialog.getByTestId('merge-next').click()
    await expect(dialog.getByTestId('merge-review-survivor')).toHaveText('Somchai Jaidee')
    await expect(dialog.getByTestId('merge-review-effects')).toContainText('move to Trash')
    await dialog.getByTestId('merge-confirm').click()

    await expect(dialog).toBeHidden()
    expect(mergeBodies).toEqual([{ source_ids: [9] }])
    await expect(page.getByText('Duplicates merged (1), linked records moved: 7').first()).toBeVisible()
    await expect(page.getByText('Kept this record\'s values for 1 fields').first()).toBeVisible()
    await expect(page.getByText('Kept this record\'s Email; Somchai J. had somchai.j@example.com').first()).toBeVisible()
  })

  test('bulk-merges selected companies into the one the user keeps', async ({ page }) => {
    const mergeCalls: Array<{ path: string, body: unknown }> = []
    let listCalls = 0
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /companies': (route) => {
        listCalls++
        return json(route, [company(3, 'Acme Co'), company(4, 'ACME Company'), company(8, 'Acme Ltd')])
      },
      'POST /companies/4/merge': async (route) => {
        mergeCalls.push({ path: '/companies/4/merge', body: route.request().postDataJSON() })
        const zero = { contacts: 0, deals: 0, leads: 0, prospects: 0, projects: 0, customer_products: 0, activities: 0, attachments: 0, tasks: 0, lead_referrals: 0, notification_logs: 0 }
        await json(route, { target: company(4, 'ACME Company'), moved: { ...zero, contacts: 3, deals: 1, total: 4 }, filled: [], conflicts: [] })
      },
    })

    await page.goto('/crm/companies')
    await page.getByTestId('companies-select-mode-toggle').click()
    const checkboxes = page.getByRole('checkbox', { name: /Select row/ })
    await checkboxes.nth(0).check()
    await expect(page.getByTestId('bulk-merge-button')).toHaveCount(0)
    await checkboxes.nth(1).check()
    await page.getByTestId('bulk-merge-button').click()

    const dialog = page.getByRole('dialog', { name: 'Merge duplicate companies' })
    await dialog.getByRole('radio', { name: 'ACME Company' }).click()
    await dialog.getByTestId('merge-next').click()
    await expect(dialog.getByTestId('merge-review-survivor')).toHaveText('ACME Company')
    const callsBefore = listCalls
    await dialog.getByTestId('merge-confirm').click()

    await expect(dialog).toBeHidden()
    expect(mergeCalls).toEqual([{ path: '/companies/4/merge', body: { source_ids: [3] } }])
    await expect(page.getByText('Duplicates merged (1), linked records moved: 4').first()).toBeVisible()
    // The list reloads (the source is in Trash now).
    await expect.poll(() => listCalls).toBeGreaterThan(callsBefore)
  })
})

test.describe('Deal value from its accepted quote', () => {
  test('is read-only with a link to the quote', async ({ page }) => {
    const deal = {
      id: 31, title: 'Renewal Deal', value: 85000, stage: 'Negotiation', status: 'open', company_id: 1, contact_id: 1,
      assigned_to: null, channel: 'Website', business_unit: null, business_unit_item: null, tags: [], position: 1,
      probability: 30, lost_reason: null, forecast_category: 'Pipeline', expected_close_date: null, created_at: now,
      value_quote_id: 12, value_quote_number: 'Q-2026-012',
    }
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /admin/pipeline-stages': route => json(route, STAGES),
      // The layout's list fetch, as on a real page load (lists carry no
      // value_quote_number).
      'GET /deals': route => json(route, [{ ...deal, value_quote_number: undefined }]),
      'GET /deals/31': route => json(route, deal),
      'GET /companies/1': route => json(route, company(1, 'Acme')),
      'GET /contacts/1': route => json(route, contact(1, 'Somchai', '')),
    })

    await page.goto('/crm/deals/31')
    await expect(page.getByTestId('deal-value-input')).toHaveValue('85,000')
    await expect(page.getByTestId('deal-value-input')).toBeDisabled()
    await expect(page.getByTestId('deal-value-quote-hint')).toHaveText('From accepted quote Q-2026-012')
    await expect(page.getByTestId('deal-value-quote-link')).toHaveAttribute('href', '/crm/quotes/12')
  })
})
