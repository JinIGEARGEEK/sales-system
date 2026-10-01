import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Deals Kanban: dragging a Deal into Lost asks for the loss reason first
// (shared CrmLostReasonModal), sends it with the stage move, and cancelling
// leaves the Deal where it was. Dropping into Won runs the same hand-off as
// the detail page's Mark Won: follow-up task + Create Project prompt. A Lead
// dropped into Won opens the Deal create form (a Won Deal needs a real value)
// and converts on save, with the same hand-off. Dragging a Won deal back to an
// open stage asks to reopen it first, and a protected Won deal (money
// attached) asks a manager for a reason, then retries with ?reason=.
const STAGES = ['Discovery', 'Qualified', 'Negotiation', 'Won', 'Lost'].map((name, i) => ({
  id: i + 1, name, sort_order: i, is_active: true, is_won_stage: name === 'Won', is_lost_stage: name === 'Lost', stale_days: null, created_at: null,
}))
const DEAL = {
  id: 31, title: 'Renewal Deal', value: 500000, stage: 'Negotiation', status: 'open', company_id: 1, contact_id: 1,
  assigned_to: null, channel: 'Website', business_unit: null, business_unit_item: null, tags: [], position: 1,
  probability: 75, lost_reason: null, forecast_category: 'Commit', expected_close_date: null, created_at: new Date().toISOString(),
}

// A Won deal with payments: the API wants a manager's reason to un-win it.
const WON_DEAL = { ...DEAL, id: 33, title: 'Signed Deal', stage: 'Won', status: 'won', position: 1 }

// What converting Lead 41 into Won from the create form returns.
const WON_FROM_LEAD = { ...DEAL, id: 52, title: 'Walk-in Co — New Opportunity', value: 250000, stage: 'Won', status: 'won', contact_id: null }

test.describe('Deals Kanban', () => {
  let moves: Array<Record<string, unknown>>
  let tasks: Array<Record<string, unknown>>
  let converts: Array<Record<string, unknown>>
  let wonMoves: Array<{ body: Record<string, unknown>, reason: string | null }>

  test.beforeEach(async ({ page }) => {
    wonMoves = []
    moves = []
    tasks = []
    converts = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /admin/pipeline-stages': route => json(route, STAGES),
      'GET /deals': (route, url) => {
        const stage = url.searchParams.get('stage')
        return json(route, stage === 'Negotiation' ? [DEAL] : stage === 'Won' ? [WON_DEAL] : [])
      },
      'PATCH /deals/33/stage': async (route, url) => {
        const body = route.request().postDataJSON()
        const reason = url.searchParams.get('reason')
        wonMoves.push({ body, reason })
        if (!reason) {
          await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: { code: 'REASON_REQUIRED', message: 'pass ?reason= to move it out of Won' } }) })
          return
        }
        await json(route, { ...WON_DEAL, stage: body.stage, status: 'open' })
      },
      // An unconverted Lead lands in the first open stage — here renamed
      // "Discovery" — not in a lane literally named "Lead".
      'GET /leads': route => json(route, [{ id: 41, name: 'Walk-in Lead', status: 'New', source: 'Website', company_id: 1, assigned_to: null, tags: [], position: 1, classification: 'none', score: 0, created_at: new Date().toISOString() }]),
      'PATCH /deals/31/stage': async (route) => {
        const body = route.request().postDataJSON()
        moves.push(body)
        await json(route, { ...DEAL, stage: body.stage, status: body.stage === 'Won' ? 'won' : body.stage === 'Lost' ? 'lost' : 'open' })
      },
      'POST /leads/41/convert': async (route) => {
        const body = route.request().postDataJSON()
        converts.push(body)
        await json(route, { deal: WON_FROM_LEAD, company: { id: 1, name: 'Walk-in Co' }, contact: null })
      },
      'GET /deals/52': route => json(route, WON_FROM_LEAD),
      'GET /companies/1': route => json(route, { id: 1, name: 'Walk-in Co', tags: [], status: 'active', created_at: new Date().toISOString() }),
      'POST /tasks': async (route) => {
        const body = route.request().postDataJSON()
        tasks.push(body)
        await json(route, { id: 77, status: 'pending', created_at: new Date().toISOString(), ...body })
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

  test('dropping into Won creates the follow-up task and offers Create Project', async ({ page }) => {
    await page.getByTestId('pipeline-card-deal-31').dragTo(page.getByTestId('pipeline-column-Won'))
    await expect.poll(() => moves.length).toBe(1)
    expect(moves[0]).toMatchObject({ stage: 'Won' })
    await expect.poll(() => tasks.length).toBe(1)
    expect(tasks[0]).toMatchObject({ related_type: 'deal', related_id: 31, title: 'Schedule kickoff call' })
    await expect(page.getByRole('dialog', { name: 'Create Project from this Deal?' })).toBeVisible()
  })

  test('dragging a Won deal back to an open stage asks to reopen it; cancelling sends nothing', async ({ page }) => {
    await page.getByTestId('pipeline-card-deal-33').dragTo(page.getByTestId('pipeline-column-Negotiation'))
    const dialog = page.getByRole('dialog', { name: 'Reopen this deal?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    expect(wonMoves).toHaveLength(0)
    await expect(page.getByTestId('pipeline-column-Won').getByTestId('pipeline-card-deal-33')).toBeVisible()
  })

  test('un-winning a protected deal asks for a reason and retries with it', async ({ page }) => {
    await page.getByTestId('pipeline-card-deal-33').dragTo(page.getByTestId('pipeline-column-Negotiation'))
    await page.getByRole('dialog', { name: 'Reopen this deal?' }).getByRole('button', { name: 'Reopen deal' }).click()

    const reasonDialog = page.getByRole('dialog', { name: 'Move a Won deal out of Won?' })
    await expect(reasonDialog).toBeVisible()
    await expect.poll(() => wonMoves.length).toBe(1)
    expect(wonMoves[0]).toMatchObject({ body: { stage: 'Negotiation' }, reason: null })

    await reasonDialog.locator('textarea').fill('Customer cancelled the contract')
    await reasonDialog.getByTestId('won-deal-reason-confirm').click()
    await expect.poll(() => wonMoves.length).toBe(2)
    expect(wonMoves[1]).toMatchObject({ body: { stage: 'Negotiation' }, reason: 'Customer cancelled the contract' })
    // exact: Reka UI 2.10's toast also repeats its text in a hidden aria-live
    // announcer ("Notification [ ... ]"), which a substring match would hit too.
    await expect(page.getByText('Deal moved to Negotiation', { exact: true })).toBeVisible()
  })

  test('a Lead dropped into Won opens the create form, then converts with its value and runs the Won hand-off', async ({ page }) => {
    await page.getByTestId('pipeline-card-lead-41').dragTo(page.getByTestId('pipeline-column-Won'))
    // No zero-value auto-convert: the rep lands on the prefilled form first.
    await expect(page).toHaveURL(/\/crm\/deals\/create\?lead_id=41&stage=Won$/)
    expect(converts).toHaveLength(0)

    await page.getByLabel('Deal Value (THB)').fill('250000')
    await page.getByTestId('deal-create-submit').click()
    await expect.poll(() => converts.length).toBe(1)
    expect(converts[0]).toMatchObject({ company_id: 1, deal: { stage: 'Won', value: 250000 } })
    await expect.poll(() => tasks.length).toBe(1)
    expect(tasks[0]).toMatchObject({ related_type: 'deal', related_id: 52, title: 'Schedule kickoff call' })
    await expect(page).toHaveURL(/\/crm\/deals\/52$/)
    await expect(page.getByRole('dialog', { name: 'Create Project from this Deal?' })).toBeVisible()
  })
})
