import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Quick-add (topbar): Add Task can relate the task to a Lead, found by
// searching the server (GET /leads?search=), not a preloaded list.
const LEAD = { id: 41, name: 'Walk-in Lead', status: 'New', source: 'Website', company_id: null, assigned_to: null, tags: [], position: 1, classification: 'none', score: 0, created_at: new Date().toISOString() }

test('Add Task from quick-add can pick a Lead, searched on the server', async ({ page }) => {
  const leadSearches: string[] = []
  await signIn(page)
  await mockApi(page, {
    'GET /auth/me': route => json(route, ADMIN),
    'GET /leads': (route, url) => {
      leadSearches.push(url.searchParams.get('name') ?? url.searchParams.get('search') ?? '')
      return json(route, [LEAD])
    },
    'GET /leads/41': route => json(route, LEAD),
  })
  await page.goto('/crm/tasks')
  await page.getByTestId('quick-add').click()
  await page.getByRole('menuitem', { name: /Add Task/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Relates To').click()
  await page.getByRole('option', { name: 'Lead' }).click()
  await dialog.getByTestId('related-record-lead').click()
  await page.keyboard.type('Walk')
  // Debounced search-as-you-type reaches the server with the typed term.
  await expect.poll(() => leadSearches.some(term => term.includes('Walk'))).toBe(true)
  await page.getByRole('option', { name: 'Walk-in Lead' }).click()
  await expect(dialog.getByTestId('related-record-lead')).toContainText('Walk-in Lead')
})
