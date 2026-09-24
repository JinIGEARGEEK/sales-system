import type { Page, Route } from '@playwright/test'

// Answers every /api/v1/* request from fixtures, whatever API_URL the build
// was made with (the path is matched, not the host). Unlisted GETs get an
// empty list so side widgets load quietly; unlisted writes fail loudly.
export type ApiHandler = (route: Route, url: URL) => Promise<void> | void

export const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ data, page: 1, per_page: 200, total: Array.isArray(data) ? data.length : 1, total_page: 1 }) })

export const ADMIN = {
  id: 1, first_name: 'Test', last_name: 'Admin', tel: '', email: 'admin@example.com', notes: '',
  accepted_consent_id: null, is_active: true, must_change_password: false, role: 'Admin',
  latest_login: null, created_at: null, updated_at: null, deleted_at: null,
}

export async function mockApi (page: Page, handlers: Record<string, ApiHandler>) {
  await page.route(/\/api\/v1\//, async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace(/^.*\/api\/v1/, '')
    const key = `${route.request().method()} ${path}`
    const handler = handlers[key]
    if (handler) return handler(route, url)
    if (route.request().method() === 'GET') return json(route, [])
    return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: `unmocked ${key}` } }) })
  })
}

// Signed-in Admin, English UI.
export async function signIn (page: Page) {
  await page.context().addCookies([{ name: 'i18n_redirected', value: 'en', url: 'http://localhost' }])
  await page.addInitScript(() => {
    window.localStorage.setItem('access_token', 'e2e-token')
    window.localStorage.setItem('lang', 'en')
  })
}
