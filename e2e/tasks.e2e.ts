import { expect, test, type Route } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Tasks page: each due-date group is its own server query (GET /tasks with
// due_from/due_before), shown with its server total; bulk Mark done asks
// for confirmation with the count before calling the API.
const day = (offset: number) => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}
const task = (id: number, title: string, dueOffset: number) => ({
  id, title, description: '', due_date: day(dueOffset), status: 'pending', priority: 'medium',
  assigned_to: null, related_type: 'company', related_id: 1, campaign_id: null, created_at: day(-10),
})
const OVERDUE = task(1, 'Chase overdue invoice', -3)
const TODAY = task(2, 'Call back today', 0)
const UPCOMING = task(3, 'Prepare next week demo', 5)

// A paged envelope whose total can exceed the rows returned (json() in
// support.ts always reports total = rows.length).
const paged = (route: Route, data: unknown[], total: number) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data, page: 1, per_page: 10, total, total_page: Math.ceil(total / 10) }) })

test.describe('Tasks page', () => {
  let bulkDone: Array<Record<string, unknown>>
  const queries: URLSearchParams[] = []

  test.beforeEach(async ({ page }) => {
    bulkDone = []
    queries.length = 0
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /companies': route => json(route, [{ id: 1, name: 'Acme Corp', status: 'active', tags: [], created_at: day(-30), updated_at: day(-30) }]),
      'GET /tasks': (route, url) => {
        const q = url.searchParams
        queries.push(q)
        if (q.get('status') !== 'pending') return paged(route, [], 0)
        if (q.get('due_before') && !q.get('due_from')) return paged(route, [OVERDUE], 12)
        if (q.get('due_from') && q.get('due_before')) return paged(route, [TODAY], 1)
        return paged(route, [UPCOMING], 1)
      },
      'PATCH /tasks/bulk-mark-done': async (route) => {
        bulkDone.push(route.request().postDataJSON())
        await route.fulfill({ status: 204 })
      },
    })
    await page.goto('/crm/tasks')
  })

  test('groups pending tasks into Overdue / Due today / Upcoming with server counts', async ({ page }) => {
    const overdue = page.getByTestId('task-group-overdue')
    await expect(overdue).toContainText('Overdue')
    await expect(overdue).toContainText('12')
    await expect(overdue).toContainText('Chase overdue invoice')
    await expect(overdue.getByRole('button', { name: /Show more/ })).toBeVisible()
    await expect(page.getByTestId('task-group-today')).toContainText('Call back today')
    await expect(page.getByTestId('task-group-upcoming')).toContainText('Prepare next week demo')
    await expect(page.getByTestId('task-group-done')).toHaveCount(0)
    expect(queries.every(q => q.get('status') === 'pending')).toBe(true)
  })

  test('bulk Mark done confirms with the count first', async ({ page }) => {
    await expect(page.getByTestId('task-group-overdue')).toContainText('Chase overdue invoice')
    await page.getByRole('button', { name: 'Select', exact: true }).click()
    await page.getByTestId('task-group-overdue').getByRole('checkbox', { name: 'Select task' }).click()
    await page.getByTestId('task-group-today').getByRole('checkbox', { name: 'Select task' }).click()
    await page.getByRole('button', { name: 'Mark Done' }).click()

    // CrmConfirmDeleteModal has no accessible name yet (its #header slot
    // replaces UModal's DialogTitle), so match the dialog by its text.
    const dialog = page.getByRole('dialog').filter({ hasText: 'Mark tasks as done?' })
    await expect(dialog).toContainText('Mark 2 selected tasks as done?')
    expect(bulkDone).toHaveLength(0)
    await dialog.getByRole('button', { name: 'Mark as Done' }).click()
    await expect.poll(() => bulkDone).toEqual([{ ids: [1, 2] }])
  })
})
