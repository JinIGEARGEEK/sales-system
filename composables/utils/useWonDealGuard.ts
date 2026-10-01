import { useI18n } from 'vue-i18n'
import WonDealReasonModal from '~/components/Crm/WonDealReasonModal.vue'

// A Won Deal with money attached (a payment, any installment, or a signed
// contract) is protected: DELETE /deals/:id and any move out of Won
// (PUT /deals/:id, PATCH /deals/:id/stage) answer 409 with error.code
//   - WON_DEAL_PROTECTED — the caller isn't an Admin/Sales Manager, so it
//     can't happen at all: we explain why;
//   - REASON_REQUIRED — a manager can, by retrying with ?reason= (max 500
//     characters, kept in the audit log): we ask for one and retry.
// `run(action, fn)` calls `fn()` and handles both; `fn(reason)` is the retry.
// Resolves `fn`'s result, or `null` when nothing happened (explained, or the
// reason prompt was dismissed) — the caller then reverts anything it showed
// optimistically and skips its success toast. Every other error is rethrown
// for the caller's usual notifier.
export const WON_DEAL_PROTECTED = 'WON_DEAL_PROTECTED'
export const REASON_REQUIRED = 'REASON_REQUIRED'

// 'delete' — DELETE /deals/:id; 'unwin' — a stage/status move out of Won.
export type WonDealAction = 'delete' | 'unwin'

// Resolves the reason the manager typed, or null when they dismissed it.
export type AskOverrideReason = (action: WonDealAction) => Promise<string | null>

export const useWonDealGuard = (options: { askReason?: AskOverrideReason } = {}) => {
  const { t } = useI18n()
  const { error } = useNotify()
  const overlay = options.askReason ? null : useOverlay()

  const askReasonInModal: AskOverrideReason = async (action) => {
    const modal = overlay!.create(WonDealReasonModal, { destroyOnClose: true })
    const reason = await modal.open({ action }).result
    return typeof reason === 'string' && reason.trim() ? reason.trim() : null
  }
  const askReason = options.askReason ?? askReasonInModal

  const run = async <T>(action: WonDealAction, fn: (reason?: string) => Promise<T>): Promise<T | null> => {
    try {
      return await fn()
    } catch (err) {
      const code = getApiErrorCode(err)
      if (code === WON_DEAL_PROTECTED) {
        error(t(`crm.deals.wonDeal.protected.${action}`))
        return null
      }
      if (code !== REASON_REQUIRED) throw err
    }
    const reason = await askReason(action)
    if (!reason) return null
    return fn(reason)
  }

  return { run }
}
