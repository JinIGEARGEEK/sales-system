import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// 2026-09-27 batch: a payment with WHT + FlowAccount document number updates
// the paid / WHT / settled totals, the Outstanding Balance aging summary,
// the Source Performance report, and Duplicate quote → the new draft.
const now = new Date().toISOString()
const STAGES = ['Discovery', 'Won', 'Lost'].map((name, i) => ({
  id: i + 1, name, sort_order: i, is_active: true, is_won_stage: name === 'Won', is_lost_stage: name === 'Lost', stale_days: null, created_at: null,
}))
const DEAL = {
  id: 41, title: 'ERP Rollout', value: 100000, stage: 'Won', status: 'won', company_id: 1, contact_id: 1,
  assigned_to: null, channel: 'Website', business_unit: null, business_unit_item: null, tags: [], position: 1,
  probability: 100, lost_reason: null, forecast_category: 'Closed', expected_close_date: null, created_at: now,
}
const COMPANY = { id: 1, name: 'Acme Co', industry: 'Tech', size: '', revenue_size: '', website: '', tags: [], notes: '', status: 'active', created_at: now, updated_at: now }
const CONTACT = { id: 1, name: 'Somchai', company_id: 1, role_title: '', email: '', phone: '', tags: [], is_primary: true, created_at: now }
const INSTALLMENT = { id: 7, deal_id: 41, amount: 107000, due_date: '2026-10-31T00:00:00Z', note: 'Deposit' }
const QUOTE = {
  id: 5, deal_id: 41, number: 'QT2026090005', items: [{ description: 'ERP licence', qty: 1, price: 100000 }], scope_of_work: '',
  validity_date: null, status: 'accepted', reference_number: null, issue_date: '2026-09-01T00:00:00Z', credit_days: 30,
  price_type: 'excl_tax', vat_enabled: true, wht_enabled: false, wht_rate: 0, discount_total: 0, notes: null, internal_notes: null,
}

test.describe('Payment tax, receivables, source performance, duplicate quote', () => {
  let paymentPosts: Array<Record<string, unknown>>
  let reportParams: URLSearchParams[]

  test.beforeEach(async ({ page }) => {
    paymentPosts = []
    reportParams = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /admin/pipeline-stages': route => json(route, STAGES),
      'GET /deals': route => json(route, [DEAL]),
      'GET /deals/41': route => json(route, DEAL),
      'GET /companies/1': route => json(route, COMPANY),
      'GET /contacts/1': route => json(route, CONTACT),
      'GET /deals/41/payments': route => json(route, { payments: [], total_paid: 0, total_wht: 0, total_settled: 0 }),
      'GET /deals/41/payment-installments': route => json(route, [{ installment: INSTALLMENT, covered: 0, status: 'upcoming' }]),
      'POST /deals/41/payments': async (route) => {
        const body = route.request().postDataJSON()
        paymentPosts.push(body)
        // The receivable is the Accepted quote's 107,000 incl. VAT.
        if (body.amount + (body.wht_amount ?? 0) > 107000.005 && !body.allow_overpayment) {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'send allow_overpayment: true to record it anyway', fields: { amount: ['exceeds_receivable'] } } }),
          })
          return
        }
        await json(route, { id: 90, deal_id: 41, created_at: now, updated_at: now, ...body }, 201)
      },
      'GET /reports/outstanding-balance': route => json(route, [
        {
          deal_id: 41, deal_title: 'ERP Rollout', company_name: 'Acme Co', deal_value: 100000, receivable_amount: 107000, receivable_source: 'quote',
          paid_amount: 50000, wht_amount: 1500, outstanding_amount: 55500, aging: 'overdue', oldest_overdue_due_date: '2026-08-01T00:00:00Z', days_overdue: 57, aging_bucket: '31_60',
        },
        {
          deal_id: 42, deal_title: 'Website Revamp', company_name: 'Beta Ltd', deal_value: 20000, receivable_amount: 20000, receivable_source: 'deal_value',
          paid_amount: 0, wht_amount: 0, outstanding_amount: 20000, aging: 'none', oldest_overdue_due_date: null, days_overdue: 0, aging_bucket: 'current',
        },
      ]),
      'GET /reports/source-performance': (route, url) => {
        reportParams.push(url.searchParams)
        return json(route, [
          { source: 'Website', leads: 10, qualified: 6, deals_won: 3, won_value: 300000, win_rate: 30, direct_deals_won: 1, direct_won_value: 50000 },
          { source: 'Referral', leads: 4, qualified: 3, deals_won: 2, won_value: 150000, win_rate: 50, direct_deals_won: 0, direct_won_value: 0 },
        ])
      },
      'GET /quotes/5': route => json(route, QUOTE),
      'GET /quotes/6': route => json(route, { ...QUOTE, id: 6, number: 'QT2026090006', status: 'draft', issue_date: '2026-09-27' }),
      'POST /quotes/5/duplicate': route => json(route, { ...QUOTE, id: 6, number: 'QT2026090006', status: 'draft', issue_date: '2026-09-27' }, 201),
    })
  })

  test('a payment over what the customer owes warns, and "Record anyway" resends it with allow_overpayment', async ({ page }) => {
    await page.goto('/crm/deals/41/payments')
    await page.getByTestId('payment-add').click()
    const dialog = page.getByRole('dialog', { name: 'Add Payment' })
    await dialog.getByTestId('payment-amount').fill('150000')
    await dialog.getByTestId('payment-save').click()

    // Refused: the dialog stays open with the warning, and Save offers to force it.
    await expect(dialog.getByTestId('payment-overpayment-warning')).toBeVisible()
    await expect(dialog.getByText('This is more than the customer still owes.')).toBeVisible()
    await expect(dialog.getByTestId('payment-save')).toHaveText('Record anyway')
    expect(paymentPosts).toHaveLength(1)
    expect(paymentPosts[0]).not.toHaveProperty('allow_overpayment')

    await dialog.getByTestId('payment-save').click()
    await expect(dialog).toBeHidden()
    expect(paymentPosts).toHaveLength(2)
    expect(paymentPosts[1]).toMatchObject({ amount: 150000, allow_overpayment: true })
    await expect(page.getByTestId('payments-total-paid')).toContainText('150,000.00')
  })

  test('adding a payment with WHT and a document number updates the totals', async ({ page }) => {
    await page.goto('/crm/deals/41/payments')
    await page.getByTestId('payment-add').click()
    const dialog = page.getByRole('dialog', { name: 'Add Payment' })
    await expect(dialog).toBeVisible()
    // Paid On defaults to today, shown in the Buddhist era.
    await expect(dialog.getByTestId('payment-paid-at')).toHaveValue(/\/25\d\d$/)

    await dialog.getByTestId('payment-amount').fill('104000')
    await dialog.getByTestId('payment-wht-fill').click()
    await expect(dialog.getByTestId('payment-wht-amount')).toHaveValue('3,000')
    await dialog.getByTestId('payment-document-number').fill('RE2026090001')
    await dialog.locator('[role="combobox"][data-cy="payment-installment"]').click()
    await page.getByRole('option', { name: /Installment 1/ }).click()
    await dialog.getByTestId('payment-save').click()

    await expect(dialog).toBeHidden()
    expect(paymentPosts).toHaveLength(1)
    expect(paymentPosts[0]).toMatchObject({ amount: 104000, wht_amount: 3000, wht_certificate_received: false, document_number: 'RE2026090001', installment_id: 7 })
    await expect(page.getByTestId('payments-total-paid')).toContainText('104,000.00')
    await expect(page.getByTestId('payments-total-wht')).toContainText('3,000.00')
    await expect(page.getByTestId('payments-total-settled')).toContainText('107,000.00')
    const row = page.getByTestId('payment-row-90')
    await expect(row).toContainText('RE2026090001')
    await expect(row).toContainText('Installment 1')
    await expect(row.getByTestId('payment-wht-pending')).toBeVisible()
  })

  test('outstanding balance shows the aging summary and filters by bucket', async ({ page }) => {
    await page.goto('/crm/reports/outstanding-balance')
    const summary = page.getByTestId('aging-summary')
    await expect(summary.getByTestId('aging-bucket-31_60-amount')).toContainText('55.5K')
    await expect(summary.getByTestId('aging-bucket-current-amount')).toContainText('20K')
    await expect(summary.getByTestId('aging-bucket-90_plus-amount')).toContainText('0')
    const table = page.getByRole('table')
    await expect(table.getByText('Accepted quote, incl. VAT')).toBeVisible()
    await expect(table.getByText('Website Revamp')).toBeVisible()

    await summary.getByTestId('aging-bucket-31_60').click()
    await expect(page).toHaveURL(/bucket=31_60/)
    await expect(table.getByText('Website Revamp')).toBeHidden()
    await expect(table.getByText('ERP Rollout')).toBeVisible()
    await expect(table.getByText('57 days')).toBeVisible()
  })

  test('source performance renders rows and totals, with the date range from the URL', async ({ page }) => {
    await page.goto('/crm/reports/source-performance?date_from=2026-09-01&date_to=2026-09-30')
    const table = page.getByRole('table')
    await expect(table.getByText('Website')).toBeVisible()
    await expect(table.getByText('50.0%')).toBeVisible()
    const summary = page.getByTestId('source-performance-summary')
    await expect(summary).toContainText('14')
    await expect(summary).toContainText('5 from leads · 1 direct')
    await expect(summary).toContainText('35.7%')
    await expect.poll(() => reportParams.length).toBeGreaterThan(0)
    expect(reportParams[0]!.get('date_from')).toBe('2026-09-01')
    expect(reportParams[0]!.get('date_to')).toBe('2026-09-30')
  })

  test('duplicating a quote opens the new draft', async ({ page }) => {
    await page.goto('/crm/quotes/5')
    await page.getByTestId('quote-duplicate').click()
    await expect(page).toHaveURL(/\/crm\/quotes\/6$/)
    await expect(page.getByText('Quote duplicated as QT2026090006', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'QT2026090006' })).toBeVisible()
  })
})
