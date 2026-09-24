import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// CRM Settings → weekly Overview Pipeline email: preview shows exactly what
// goes out, and the on/off switch saves without the revenue figures changing.
const SETTINGS = {
  id: 1, quarterly_sales_target: 3000000, annual_revenue_goal: 12000000, lead_scoring_mql_threshold: 50,
  require_signed_contract_before_won: false, weekly_digest_enabled: true, last_weekly_digest_at: null,
  updated_at: new Date().toISOString(), smtp_configured: true,
}

test('weekly email: preview and switch', async ({ page }) => {
  const patches: Array<Record<string, unknown>> = []
  await signIn(page)
  await mockApi(page, {
    'GET /auth/me': route => json(route, ADMIN),
    'GET /admin/settings': route => json(route, SETTINGS),
    'GET /admin/weekly-digest/preview': route => json(route, {
      subject: 'Weekly pipeline review: 14 Sep - 20 Sep 2026',
      body: 'SUMMARY\n  New Prospects   7 (+4)\n\nNEEDS ATTENTION\n  2 open deals worth ฿1.2M are past their stage\'s stale limit.',
      recipients: ['ceo@example.com', 'manager@example.com'], week_from: '2026-09-14', week_to: '2026-09-20',
      enabled: true, smtp_configured: true, last_sent_at: null,
    }),
    'PATCH /admin/settings': async (route) => {
      patches.push(route.request().postDataJSON())
      await json(route, { ...SETTINGS, weekly_digest_enabled: false })
    },
  })
  await page.goto('/admin/pipeline-config')
  await page.getByRole('tab', { name: /Sales Quota/ }).click()

  const card = page.getByTestId('weekly-digest-card')
  await card.getByTestId('weekly-digest-preview').click()
  const dialog = page.getByRole('dialog', { name: 'Weekly email preview' })
  await expect(dialog).toContainText('Weekly pipeline review: 14 Sep - 20 Sep 2026')
  await expect(dialog).toContainText('ceo@example.com, manager@example.com')
  await expect(dialog.getByTestId('weekly-digest-preview-body')).toContainText('NEEDS ATTENTION')
  await dialog.getByRole('button', { name: 'Close' }).click()

  await card.getByTestId('weekly-digest-enabled').click()
  await expect.poll(() => patches.length).toBe(1)
  expect(patches[0]).toEqual({ quarterly_sales_target: 3000000, annual_revenue_goal: 12000000, weekly_digest_enabled: false })
})
