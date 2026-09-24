import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Deals Kanban: dragging a Deal into Lost asks for the loss reason first
// (shared CrmLostReasonModal), sends it with the stage move, and cancelling
// leaves the Deal where it was.
const STAGES = ['Discovery', 'Qualified', 'Negotiation', 'Won', 'Lost'].map((name, i) => ({
  id: i + 1, name, sort_order: i, is_active: true, is_won_stage: name === 'Won', is_lost_stage: name === 'Lost', stale_days: null, created_at: null,
}))
const DEAL = {
  id: 31, title: 'Renewal Deal', value: 500000, stage: 'Negotiation', status: 'open', company_id: 1, contact_id: 1,
  assigned_to: null, channel: 'Website', business_unit: null, business_unit_item: null, tags: [], position: 1,
  probability: 75, lost_reason: null, forecast_category: 'Commit', expected_close_date: null, created_at: new Date().toISOString(),
}

test.describe('Deals Kanban', () => {
  let moves: Array<Record<string, unknown>>

  test.beforeEach(async ({ page }) => {
    moves = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /admin/pipeline-stages': route => json(route, STAGES),
      'GET /deals': (route, url) => json(route, url.searchParams.get('stage') === 'Negotiation' ? [DEAL] : []),
      // An unconverted Lead lands in the first open stage — here renamed
      // "Discovery" — not in a lane literally named "Lead".
      'GET /leads': route => json(route, [{ id: 41, name: 'Walk-in Lead', status: 'New', source: 'Website', company_id: null, assigned_to: null, tags: [], position: 1, classification: 'none', score: 0, created_at: new Date().toISOString() }]),
      'PATCH /deals/31/stage': async (route) => {
        moves.push(route.request().postDataJSON())
        await json(route, { ...DEAL, stage: 'Lost', status: 'lost' })
      },
    })
    await page.goto('/crm/deals')
    await expect(page.getByTestId('pipeline-card-deal-31')).toBeVisible()
  })

  test('unconverted Leads sit in the first open stage, whatever it is called', async ({ page }) => {
    await expect(page.getByTestId('pipeline-column-Discovery').getByTestId('pipeline-card-lead-41')).toBeVisible()
  })

  test('dragging into Lost asks for a reason and sends it', async ({ page }) => {
    await page.getByTestId('pipeline-card-deal-31').dragTo(page.getByTestId('pipeline-column-Lost'))
    const dialog = page.getByRole('dialog', { name: /Why was this deal lost/ })
    await expect(dialog).toBeVisible()
    expect(moves).toHaveLength(0)

    await dialog.locator('[role="combobox"][data-cy="lost-reason-select"]').click()
    await page.getByRole('option', { name: 'Price' }).click()
    await dialog.getByRole('button', { name: 'Mark as Lost' }).click()
    await expect.poll(() => moves.length).toBe(1)
    expect(moves[0]).toMatchObject({ stage: 'Lost', lost_reason: 'price' })
  })

  test('cancelling the reason leaves the Deal where it was', async ({ page }) => {
    await page.getByTestId('pipeline-card-deal-31').dragTo(page.getByTestId('pipeline-column-Lost'))
    const dialog = page.getByRole('dialog', { name: /Why was this deal lost/ })
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    expect(moves).toHaveLength(0)
    await expect(page.getByTestId('pipeline-column-Negotiation').getByTestId('pipeline-card-deal-31')).toBeVisible()
  })
})
