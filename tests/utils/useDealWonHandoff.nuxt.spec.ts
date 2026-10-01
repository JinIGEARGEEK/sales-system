import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeDeal, apiResponse } from '../factories'

// Same approach as tests/utils/useWonFollowUpTask.nuxt.spec.ts: echo i18n keys
// back, and spy on the real $api instance (useNotify needs the real
// useNuxtApp/useToast machinery intact).
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 9,
  company_id: 1,
  deal_id: null,
  name: 'Existing',
  status: 'planning',
  production_reference: null,
  start_date: null,
  target_end_date: null,
  expected_proposal_date: null,
  expected_start_date: null,
  notes: '',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
} as Project)

describe('useDealWonHandoff', () => {
  beforeEach(() => {
    useTasksStore().$reset()
    useProjectsStore().$reset()
    useDealsStore().$reset()
    usePipelineStagesStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates the follow-up task and offers Create Project for a newly Won deal', async () => {
    const api = useNuxtApp().$api
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(apiResponse({ id: 1 }) as never)
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue(apiResponse([]) as never)
    const deal = makeDeal({ id: 42, company_id: 3, assigned_to: 7, status: 'won' })

    const { onDealWon, projectModal, handoffDeal } = useDealWonHandoff()
    await onDealWon(deal)

    expect(postSpy).toHaveBeenCalledWith('/tasks', expect.objectContaining({
      related_type: 'deal',
      related_id: 42,
      title: 'crm.deals.detail.wonFollowUpTaskTitle',
      assigned_to: 7,
    }))
    expect(getSpy).toHaveBeenCalledWith('/companies/3/projects')
    expect(projectModal.value).toBe(true)
    expect(handoffDeal.value?.id).toBe(42)
  })

  it('skips the follow-up task when the deal was already Won', async () => {
    const api = useNuxtApp().$api
    const postSpy = vi.spyOn(api, 'post')
    vi.spyOn(api, 'get').mockResolvedValue(apiResponse([]) as never)

    const { onDealWon } = useDealWonHandoff()
    await onDealWon(makeDeal({ id: 42, status: 'won' }), { wasWon: true })

    expect(postSpy).not.toHaveBeenCalled()
  })

  it('does not offer Create Project when the deal already has one', async () => {
    const api = useNuxtApp().$api
    vi.spyOn(api, 'post').mockResolvedValue(apiResponse({ id: 1 }) as never)
    vi.spyOn(api, 'get').mockResolvedValue(apiResponse([makeProject({ company_id: 1, deal_id: 42 })]) as never)

    const { onDealWon, projectModal } = useDealWonHandoff()
    await onDealWon(makeDeal({ id: 42, company_id: 1, status: 'won' }))

    expect(projectModal.value).toBe(false)
  })

  it('Create Project links the new project to the Won deal, whatever deal_id the modal sends', async () => {
    const api = useNuxtApp().$api
    vi.spyOn(api, 'get').mockResolvedValue(apiResponse([]) as never)
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(apiResponse(makeProject({ id: 10, company_id: 3, deal_id: 42 })) as never)

    const { onDealWon, onCreateProject } = useDealWonHandoff()
    await onDealWon(makeDeal({ id: 42, company_id: 3, title: 'Warehouse system', status: 'won' }), { wasWon: true })
    // CrmAddProjectModal hides its Deal picker in the hand-off, so its
    // create payload carries deal_id: null — that must not unlink the deal.
    await onCreateProject({ status: 'Not Started', production_reference: null, name: 'Warehouse system', notes: '', deal_id: null })

    const projectPost = postSpy.mock.calls.find(([url]) => String(url).includes('/projects'))
    expect(projectPost?.[1]).toMatchObject({ deal_id: 42, name: 'Warehouse system', status: 'Not Started' })
  })

  it('markWon moves the deal into the configured Won stage, then hands off', async () => {
    const api = useNuxtApp().$api
    usePipelineStagesStore().items = [
      { id: 1, name: 'Closed Won', sort_order: 1, is_active: true, is_won_stage: true, is_lost_stage: false } as PipelineStage,
    ]
    const deal = makeDeal({ id: 5, status: 'open', stage: 'Negotiation' })
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValue(apiResponse({ ...deal, stage: 'Closed Won', status: 'won' }) as never)
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(apiResponse({ id: 1 }) as never)
    vi.spyOn(api, 'get').mockResolvedValue(apiResponse([]) as never)

    const { markWon, projectModal } = useDealWonHandoff()
    const updated = await markWon(deal)

    expect(patchSpy).toHaveBeenCalledWith('/deals/5/stage', expect.objectContaining({ stage: 'Closed Won' }))
    expect(updated.status).toBe('won')
    expect(postSpy).toHaveBeenCalledWith('/tasks', expect.objectContaining({ related_id: 5 }))
    expect(projectModal.value).toBe(true)
  })
})
