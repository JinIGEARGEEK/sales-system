import type { InjectionKey } from 'vue'
import { useI18n } from 'vue-i18n'

// The one hand-off every path into Won runs (FR-CRM-068/048): the Deal detail
// header's Mark Won, the Overview tab's Stage save, a drop into the Won lane on
// the Kanban board (a Deal, or a Lead that converts on the way), a stage change
// to Won in the Overview Pipeline panel, and "Mark this deal as Won?" after a
// Contract is signed.
// Each of them used to wire the follow-up task and the Create Project prompt
// by hand (the board did neither) — now they all call onDealWon()/markWon().
//
// The caller renders <CrmWonHandoffProjectModal :handoff="..."> with this
// instance. On the Deal detail page the layout owns that one modal and
// provides this instance to its tabs (provideDealWonHandoff/injectDealWonHandoff),
// so the Contracts tab and the Overview save never open a second copy.
export const useDealWonHandoff = () => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const dealsStore = useDealsStore()
  const projectsStore = useProjectsStore()
  const pipelineStagesStore = usePipelineStagesStore()

  // The Deal whose hand-off is in progress — the Create Project modal's
  // defaults (name, target end date) read from it.
  const handoffDeal = ref<Deal | null>(null)
  const projectModal = ref(false)
  const { createWonFollowUpTask } = useWonFollowUpTask()

  // Opens Create Project unless the Deal already has one — Project supports
  // at most one per Deal (projectsStore.forDeal). Re-fetches the company's
  // projects first so a Project created elsewhere (or never loaded on this
  // screen, e.g. the board) isn't duplicated.
  const promptCreateProject = async (deal: Deal) => {
    handoffDeal.value = deal
    try {
      await projectsStore.fetchForCompany(deal.company_id)
    } catch (err) {
      notifyApiError(err)
      return
    }
    if (!projectsStore.forDeal(deal.id)) projectModal.value = true
  }

  // Call once a Deal has actually moved into Won (pass the record the API
  // returned). `wasWon` skips the follow-up task for a Deal that was already
  // Won before this save (e.g. re-saving an unrelated field). `promptProject:
  // false` is for a caller that's about to navigate away — a Lead dropped
  // into Won on the board lands on the new Deal's page, which offers Create
  // Project itself (see WON_HANDOFF_QUERY).
  const onDealWon = async (deal: Deal, { wasWon = false, promptProject = true }: { wasWon?: boolean, promptProject?: boolean } = {}) => {
    handoffDeal.value = deal
    if (!wasWon) createWonFollowUpTask(deal)
    if (promptProject) await promptCreateProject(deal)
  }

  // Moves the Deal into the configured Won stage through the narrow
  // PATCH /deals/:id/stage, then runs the hand-off. Throws on failure — the
  // caller reports it (notifyStageChangeError covers the contract gate).
  const markWon = async (deal: Deal) => {
    const wasWon = deal.status === 'won'
    const updated = await dealsStore.updateStage(deal.id, pipelineStagesStore.wonStageName as DealStage)
    success(t('crm.deals.detail.markWonSuccess'))
    await onDealWon(updated, { wasWon })
    return updated
  }

  const onCreateProject = async (payload: ProjectModalPayload) => {
    const deal = handoffDeal.value
    if (!deal) return
    try {
      // The hand-off opens CrmAddProjectModal in create mode, which sends
      // every field; the defaults only satisfy the modal's wider emit type
      // (same as useProjectModal's create path).
      await projectsStore.add(deal.company_id, {
        deal_id: deal.id,
        start_date: new Date(),
        name: payload.name ?? deal.title,
        target_end_date: payload.target_end_date ?? null,
        expected_proposal_date: payload.expected_proposal_date ?? null,
        expected_start_date: payload.expected_start_date ?? null,
        notes: payload.notes ?? '',
        status: payload.status,
        production_reference: payload.production_reference,
      })
      success(t('crm.deals.detail.createProjectSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
      // Keeps CrmAddProjectModal (useAwaitableEmit) open with the form intact.
      return false
    }
  }

  return { handoffDeal, projectModal, promptCreateProject, onDealWon, markWon, onCreateProject }
}

export type DealWonHandoff = ReturnType<typeof useDealWonHandoff>

// One-time query flag (`/crm/deals/:id?won_handoff=1`): the Deal detail page
// opens Create Project on arrival, then strips the flag so a refresh or a
// back-navigation doesn't prompt again.
export const WON_HANDOFF_QUERY = 'won_handoff'

const DEAL_WON_HANDOFF_KEY: InjectionKey<DealWonHandoff> = Symbol('dealWonHandoff')

export const provideDealWonHandoff = () => {
  const handoff = useDealWonHandoff()
  provide(DEAL_WON_HANDOFF_KEY, handoff)
  return handoff
}

// Falls back to a private instance outside the Deal detail layout, so a tab
// rendered on its own (tests) still creates the follow-up task.
export const injectDealWonHandoff = () => inject(DEAL_WON_HANDOFF_KEY, null) ?? useDealWonHandoff()

// The error toast for a failed stage move — the FR-CRM-045 contract gate gets
// its own actionable message, anything else the API's own.
export const useStageChangeErrorNotifier = () => {
  const { t } = useI18n()
  const { error } = useNotify()
  return (err: unknown) => {
    if (apiErrorHasFieldCode(err, 'stage', 'requires_signed_contract')) {
      error(t('crm.deals.detail.contractRequiredToast'))
    } else {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
}
