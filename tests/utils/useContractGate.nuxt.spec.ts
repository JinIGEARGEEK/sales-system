import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeDeal, makeContract } from '../factories'

// useContractGate -> useApiErrorNotifier() calls useI18n(), which needs the
// full i18n plugin (not provided by a plain composable call in this test) —
// same mocking approach as tests/AccessGate/AccessGate.nuxt.spec.ts and
// tests/utils/usePageAccess.nuxt.spec.ts. The gate logic itself never calls
// `t`, so the stub's return value doesn't matter here.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// contractsStore.fetchForDeal / appSettingsStore.fetchAll both go through
// useNuxtApp().$api. Unlike tests/stores/deals.nuxt.spec.ts, this composable
// also (via useApiErrorNotifier -> useNotify) calls useToast(), which itself
// resolves the real useNuxtApp() internally — replacing the whole
// useNuxtApp() auto-import (mockNuxtImport) breaks that call too, since Nuxt
// core resolves the same mocked module. So instead this spies on the *real*
// app's already-provided $api instance methods directly, leaving the rest of
// the real nuxtApp (and useToast/useState) untouched.
const mockGet = () => vi.spyOn(useNuxtApp().$api, 'get')

describe('useContractGate', () => {
  beforeEach(() => {
    useContractsStore().$reset()
    useAppSettingsStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns when the setting is on, the deal is still open, and it has no signed contract', () => {
    useAppSettingsStore().settings = { id: 1, require_signed_contract_before_won: true } as AppSettings
    useContractsStore().items = [makeContract({ deal_id: 1, status: 'draft' })]
    const deal = ref(makeDeal({ status: 'open' }))

    const { showContractGateWarning } = useContractGate(1, deal)

    expect(showContractGateWarning.value).toBe(true)
  })

  it('does not warn once the deal already has a signed contract', () => {
    useAppSettingsStore().settings = { id: 1, require_signed_contract_before_won: true } as AppSettings
    useContractsStore().items = [makeContract({ deal_id: 1, status: 'signed' })]
    const deal = ref(makeDeal({ status: 'open' }))

    const { showContractGateWarning } = useContractGate(1, deal)

    expect(showContractGateWarning.value).toBe(false)
  })

  it('does not warn once the deal is already Won, even with no signed contract', () => {
    useAppSettingsStore().settings = { id: 1, require_signed_contract_before_won: true } as AppSettings
    useContractsStore().items = [makeContract({ deal_id: 1, status: 'draft' })]
    const deal = ref(makeDeal({ status: 'won' }))

    const { showContractGateWarning } = useContractGate(1, deal)

    expect(showContractGateWarning.value).toBe(false)
  })

  it('does not warn when the require_signed_contract_before_won setting is off', () => {
    useAppSettingsStore().settings = { id: 1, require_signed_contract_before_won: false } as AppSettings
    useContractsStore().items = [makeContract({ deal_id: 1, status: 'draft' })]
    const deal = ref(makeDeal({ status: 'open' }))

    const { showContractGateWarning } = useContractGate(1, deal)

    expect(showContractGateWarning.value).toBe(false)
  })

  it('only counts a signed contract that belongs to this deal', () => {
    useAppSettingsStore().settings = { id: 1, require_signed_contract_before_won: true } as AppSettings
    useContractsStore().items = [makeContract({ deal_id: 2, status: 'signed' })]
    const deal = ref(makeDeal({ id: 1, status: 'open' }))

    const { showContractGateWarning } = useContractGate(1, deal)

    expect(showContractGateWarning.value).toBe(true)
  })

  it('fetches contracts and settings on first use when neither store is loaded yet for this deal', () => {
    const getSpy = mockGet().mockResolvedValue({ data: { data: [], page: 1, per_page: 200, total: 0, total_page: 1, next: 0, prev: 0 } } as never)
    const deal = ref(makeDeal({ status: 'open' }))

    useContractGate(1, deal)

    expect(getSpy).toHaveBeenCalledWith('/deals/1/contracts')
    expect(getSpy).toHaveBeenCalledWith('/admin/settings')
  })

  it('does not re-fetch settings when appSettingsStore.settings is already loaded', () => {
    useAppSettingsStore().settings = { id: 1, require_signed_contract_before_won: false } as AppSettings
    const getSpy = mockGet().mockResolvedValue({ data: { data: [], page: 1, per_page: 200, total: 0, total_page: 1, next: 0, prev: 0 } } as never)
    const deal = ref(makeDeal({ status: 'open' }))

    useContractGate(1, deal)

    expect(getSpy).not.toHaveBeenCalledWith('/admin/settings')
  })
})
