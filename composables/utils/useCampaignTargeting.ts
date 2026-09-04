// Shared "Add to Campaign" plumbing (FR-CRM-112) — every entry point
// (Companies/Leads/Contacts list bulk-select + row action, and each of
// their detail pages) needs the same open-modal-then-submit flow: hold the
// targets the modal was opened with, call campaignsStore.submitCampaignTasks,
// and toast create-vs-add success or a generic error. Centralized here
// rather than copy-pasted six times so a future change to that flow (e.g.
// error-handling behavior) only needs to happen once.
import { useI18n } from 'vue-i18n'

export const useCampaignTargeting = (
  // i18n keys for the two possible outcomes — each caller's own
  // crm.<entity>.index.campaignCreateSuccess/campaignAddSuccess, both
  // taking {name, count}.
  successKeys: { create: string, add: string },
  // Called after a successful submit — e.g. a list page clearing its row
  // selection. Detail pages (single, always-the-same target) have nothing
  // to clear and can omit this.
  onSuccess?: () => void,
) => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const campaignsStore = useCampaignsStore()

  const createCampaignOpen = ref(false)
  const campaignTargets = ref<CampaignTarget[]>([])

  const openCampaignModal = (targets: CampaignTarget[]) => {
    campaignTargets.value = targets
    createCampaignOpen.value = true
  }

  const onSubmitCampaign = async (payload: CampaignTaskSetupSubmitPayload) => {
    try {
      const campaign = await campaignsStore.submitCampaignTasks(campaignTargets.value, payload)
      success(t(payload.mode === 'existing' ? successKeys.add : successKeys.create, { name: campaign.name, count: campaignTargets.value.length }))
      onSuccess?.()
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }

  return { createCampaignOpen, campaignTargets, openCampaignModal, onSubmitCampaign }
}
