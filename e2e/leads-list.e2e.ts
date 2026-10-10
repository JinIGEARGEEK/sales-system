import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Leads list: the status pills carry per-status counts
// (GET /leads/status-counts) and a Lead's status changes inline through
// PATCH /leads/:id/status, without opening the Lead.
const LEAD = { id: 41, name: 'Walk-in Lead', status: 'New', source: 'Website', company_id: null, assigned_to: null, tags: [], position: 1, classification: 'none', score: 0, created_at: new Date().toISOString() }

test('status pills show counts and a status changes inline', async ({ page }) => {
  let counts: Record<string, number> = { New: 1, Qualified: 2 }
  const statusPatches: unknown[] = []
  await signIn(page)
  await mockApi(page, {
    'GET /auth/me': route => json(route, ADMIN),
    'GET /leads': route => json(route, [LEAD]),
    'GET /leads/status-counts': route => json(route, counts),
    'PATCH /leads/41/status': async (route) => {
      statusPatches.push(route.request().postDataJSON())
      counts = { Contacted: 1, Qualified: 2 }
      await json(route, { ...LEAD, status: 'Contacted' })
    },
  })
  await page.goto('/crm/leads')

  const pill = (name: string) => page.getByRole('button', { name: new RegExp(`^${name}`) })
  await expect(pill('All Status')).toContainText('3')
  await expect(pill('New')).toContainText('1')
  await expect(pill('Contacted')).toContainText('0')

  await page.locator('[data-cy="lead-status-select-41"]:visible').click()
  await page.getByRole('option', { name: 'Contacted' }).click()

  await expect.poll(() => statusPatches).toEqual([{ status: 'Contacted' }])
  await expect(page.getByText('Walk-in Lead moved to Contacted', { exact: true })).toBeVisible()
  await expect(pill('Contacted')).toContainText('1')
  await expect(pill('New')).toContainText('0')
})
