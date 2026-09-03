import { useI18n } from 'vue-i18n'

// Shared by pages/crm/deals/[id].vue's "Mark Won" action and
// pages/crm/deals/[id]/contracts.vue's Contract-Signed flow (FR-CRM-068,
// FR-CRM-048) — both are real "we now have a customer engagement" moments
// that should prompt for a Project, via the same CrmAddProjectModal and the
// same creation call. Centralized so the two triggers can't drift (e.g. a
// changed success message or a new required field) and so the "don't prompt
// twice for the same Deal" guard only has to be right once.
export const useCreateProjectFromDeal = (deal: Ref<Deal | null>) => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const projectsStore = useProjectsStore()

  // Ensures projectsStore.forDeal() below is actually populated — Projects
  // are otherwise only fetched from the Company/Projects-list pages, never
  // from the Deal detail page.
  watch(deal, (value) => {
    if (value) projectsStore.fetchForCompany(value.company_id).catch(notifyApiError)
  }, { immediate: true })

  const projectModal = ref(false)

  // Opens the Create Project modal unless this Deal already has one — Project
  // has no support for more than one per Deal (stores/projects.ts's forDeal
  // getter assumes at most one), and this can now be triggered by either
  // flow above, so whichever gets there first should be the only one that
  // opens it.
  const promptCreateProject = () => {
    if (deal.value && !projectsStore.forDeal(deal.value.id)) {
      projectModal.value = true
    }
  }

  const onCreateProject = async (payload: {
    name: string
    status: ProjectStatus
    production_reference: string | null
    target_end_date: Date | null
    expected_proposal_date: Date | null
    expected_start_date: Date | null
    notes: string
  }) => {
    if (!deal.value) return
    try {
      await projectsStore.add(deal.value.company_id, {
        deal_id: deal.value.id,
        start_date: new Date(),
        ...payload,
      })
      success(t('crm.deals.detail.createProjectSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }

  return { projectModal, promptCreateProject, onCreateProject }
}
