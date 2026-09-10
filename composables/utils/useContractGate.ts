// FR-CRM-045's "signed contract required before Won" gate, shared by the
// Deal Overview and Contracts tabs (pages/crm/deals/[id]/index.vue,
// pages/crm/deals/[id]/contracts.vue) — previously each tab re-derived this
// same three-condition rule independently, risking the two drifting apart on
// a future change. Owns the Contracts/AppSettings fetch-on-mount too (guarded
// on already-loaded, same convention as this file's callers use for their
// own store fetches) so switching between the two tabs doesn't re-issue the
// same GET /deals/:id/contracts every time.
export const useContractGate = (dealId: number, deal: Ref<Deal | null>) => {
  const contractsStore = useContractsStore()
  const appSettingsStore = useAppSettingsStore()
  const { notifyApiError } = useApiErrorNotifier()

  if (contractsStore.forDeal(dealId).length === 0) contractsStore.fetchForDeal(dealId).catch(notifyApiError)
  if (!appSettingsStore.settings) appSettingsStore.fetchAll().catch(notifyApiError)

  const hasSignedContract = computed(() => contractsStore.forDeal(dealId).some(c => c.status === 'signed'))

  // Already-Won deals never show this — the gate only matters on the way in.
  const showContractGateWarning = computed(() =>
    appSettingsStore.settings?.require_signed_contract_before_won === true
    && deal.value?.status !== 'won'
    && !hasSignedContract.value,
  )

  return { showContractGateWarning }
}
