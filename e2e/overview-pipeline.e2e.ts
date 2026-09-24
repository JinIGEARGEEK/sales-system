import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'
import { overviewFixture } from './fixtures/overview'

// Smoke test for the Overview Pipeline page (FR-CRM-123): it renders every
// lane kind from the API, uses the API's exact highlight counts, highlights
// slips, asks for a loss reason, and routes "other"-lane cards to the stage
// picker.
test.describe('Overview Pipeline', () => {
  let stageMoves: Array<{ id: string, body: Record<string, unknown> }>

  test.beforeEach(async ({ page }) => {
    stageMoves = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /pipeline/overview': route => json(route, overviewFixture()),
      'GET /admin/pipeline-stages': route => json(route, [
        { id: 1, name: 'Qualified', sort_order: 1, is_active: true, is_won_stage: false, is_lost_stage: false, stale_days: null, created_at: null },
        { id: 2, name: 'Negotiation', sort_order: 2, is_active: true, is_won_stage: false, is_lost_stage: false, stale_days: 30, created_at: null },
        { id: 3, name: 'Won', sort_order: 3, is_active: true, is_won_stage: true, is_lost_stage: false, stale_days: null, created_at: null },
        { id: 4, name: 'Lost', sort_order: 4, is_active: true, is_won_stage: false, is_lost_stage: true, stale_days: null, created_at: null },
      ]),
      'PATCH /deals/21/stage': async (route) => {
        stageMoves.push({ id: '21', body: route.request().postDataJSON() })
        await json(route, { id: 21, stage: 'Lost', status: 'lost', created_at: new Date().toISOString() })
      },
    })
    await page.goto('/crm/overview-pipeline?period=quarter')
    await expect(page.getByTestId('overview-summary')).toBeVisible()
  })

  test('renders every lane kind, cohort conversion and exact counts', async ({ page }) => {
    await expect(page.locator('[data-cy="overview-lane-prospect-other"]')).toBeVisible()
    await expect(page.locator('[data-cy="overview-lane-prospect-other"]')).toContainText('Blank Status Prospect')
    await expect(page.locator('[data-cy="overview-lane-lead-Converted"]')).toContainText('Converted Lead')
    await expect(page.getByTestId('overview-summary')).toContainText('2 of 7 new Prospects became Leads · 29%')
    // The banner and toolbar use the API's totals, not the 2 deal cards loaded.
    await expect(page.getByTestId('overview-stale-alert')).toContainText('17 open deals')
    await expect(page.getByTestId('overview-toolbar').getByRole('button', { name: /Stale/ })).toContainText('42')
  })

  test('"Slipped back" dims everything but backward moves', async ({ page }) => {
    const toolbar = page.getByTestId('overview-toolbar')
    await toolbar.getByRole('button', { name: /Slipped back/ }).click()
    await expect(toolbar.getByRole('button', { name: /Slipped back/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cy="overview-card-deal-21"]')).not.toHaveClass(/opacity-35/)
    await expect(page.locator('[data-cy="overview-card-deal-22"]')).toHaveClass(/opacity-35/)
    await expect(page.locator('[data-cy="overview-card-deal-21"]')).toContainText('Slipped back')
  })

  test('moving a Deal to Lost asks for the reason and sends it', async ({ page }) => {
    await page.locator('[data-cy="overview-card-deal-21"]').click()
    // InputSelect puts data-cy on both its field wrapper and the combobox itself.
    await page.locator('[role="combobox"][data-cy="overview-panel-stage"]').click()
    await page.getByRole('option', { name: 'Lost', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: /Why was this deal lost/ })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Mark as Lost' })).toBeDisabled()
    await dialog.locator('[role="combobox"][data-cy="overview-lost-reason"]').click()
    await page.getByRole('option', { name: 'Competitor' }).click()
    await dialog.getByRole('button', { name: 'Mark as Lost' }).click()

    await expect.poll(() => stageMoves.length).toBe(1)
    expect(stageMoves[0]!.body).toMatchObject({ stage: 'Lost', lost_reason: 'competitor' })
  })

  test('an "other" lane card opens with a stage picker and an explanation', async ({ page }) => {
    await page.locator('[data-cy="overview-card-prospect-2"]').click()
    const panel = page.getByRole('dialog')
    await expect(panel).toContainText('isn’t one of the active stages')
    await expect(panel.locator('[role="combobox"][data-cy="overview-panel-stage"]')).toContainText('Pick a stage')
  })
})
