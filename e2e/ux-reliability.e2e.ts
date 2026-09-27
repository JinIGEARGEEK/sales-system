import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Detail pages show a loading skeleton (not "not found") while their record
// is in flight, and the Log Activity modal waits for its save — optionally
// creating a follow-up Task on the same record — and stays open on failure.
const now = new Date().toISOString()
const CONTACT = { id: 1, name: 'Somchai Jaidee', company_id: 1, role_title: '', email: '', phone: '', tags: [], is_primary: false, created_at: now }
const COMPANY = { id: 1, name: 'Acme', industry: 'Tech', size: '', revenue_size: '', website: '', tags: [], notes: '', status: 'active', created_at: now, updated_at: now }

test.describe('Detail page loading', () => {
  test('shows the skeleton until the record arrives, then the record', async ({ page }) => {
    let release!: () => void
    const released = new Promise<void>((resolve) => { release = resolve })
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /companies/1': route => json(route, COMPANY),
      'GET /contacts/1': async (route) => {
        await released
        await json(route, CONTACT)
      },
    })

    await page.goto('/crm/contacts/1')
    await expect(page.getByTestId('detail-skeleton')).toBeVisible()
    await expect(page.getByText('Contact not found')).toBeHidden()

    release()
    await expect(page.getByRole('heading', { name: 'Somchai Jaidee' })).toBeVisible()
    await expect(page.getByTestId('detail-skeleton')).toBeHidden()
  })

  // A 500, not a 404: the axios plugin routes every 404 to /error404.
  test('shows "not found" once the fetch fails', async ({ page }) => {
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /contacts/99': route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Server unavailable' } }) }),
    })

    await page.goto('/crm/contacts/99')
    await expect(page.getByText('Contact not found')).toBeVisible()
    await expect(page.getByTestId('detail-skeleton')).toBeHidden()
  })
})

test.describe('Log Activity modal', () => {
  let activityPosts: Array<Record<string, unknown>>
  let taskPosts: Array<Record<string, unknown>>
  let failActivity: boolean

  test.beforeEach(async ({ page }) => {
    activityPosts = []
    taskPosts = []
    failActivity = false
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /contacts/1': route => json(route, CONTACT),
      'GET /companies/1': route => json(route, COMPANY),
      'POST /activities': async (route) => {
        const body = route.request().postDataJSON()
        activityPosts.push(body)
        if (failActivity) {
          await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Server unavailable' } }) })
          return
        }
        await json(route, { id: 50, created_by: 'Test Admin', ...body })
      },
      'POST /tasks': async (route) => {
        const body = route.request().postDataJSON()
        taskPosts.push(body)
        await json(route, { id: 60, status: 'pending', created_at: now, ...body })
      },
    })
  })

  test('logs the activity and creates the follow-up task on the same record', async ({ page }) => {
    await page.goto('/crm/contacts/1')
    await page.getByTestId('contact-add-activity').click()
    const dialog = page.getByRole('dialog', { name: 'Log Activity' })
    await expect(dialog).toBeVisible()

    await dialog.locator('input[name="subject"]').fill('Intro call')
    await dialog.getByRole('checkbox', { name: 'Create follow-up task' }).click()
    await expect(dialog.locator('input[name="follow_up_title"]')).toHaveValue('Follow up: Intro call')
    await dialog.getByTestId('activity-save').click()

    await expect(dialog).toBeHidden()
    expect(activityPosts).toHaveLength(1)
    expect(activityPosts[0]).toMatchObject({ related_type: 'contact', related_id: 1, subject: 'Intro call' })
    expect(taskPosts).toHaveLength(1)
    expect(taskPosts[0]).toMatchObject({ related_type: 'contact', related_id: 1, title: 'Follow up: Intro call', assigned_to: ADMIN.id })
    await expect(page.getByText('Activity logged and follow-up task added', { exact: true })).toBeVisible()
  })

  test('stays open with the form intact when the save fails', async ({ page }) => {
    failActivity = true
    await page.goto('/crm/contacts/1')
    await page.getByTestId('contact-add-activity').click()
    const dialog = page.getByRole('dialog', { name: 'Log Activity' })
    await dialog.locator('input[name="subject"]').fill('Intro call')
    await dialog.getByTestId('activity-save').click()

    await expect(page.getByText('Server unavailable', { exact: true })).toBeVisible()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input[name="subject"]')).toHaveValue('Intro call')
    expect(activityPosts).toHaveLength(1)
    expect(taskPosts).toHaveLength(0)
  })
})
