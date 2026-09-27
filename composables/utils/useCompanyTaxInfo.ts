import type { Ref } from 'vue'

// Thai tax-invoice buyer details on a Company: tax_id (13 digits, mod-11
// check digit — the same scheme for juristic and personal IDs), branch_code
// and postal_code (5 digits each; branch "00000" = head office).

export const HEAD_OFFICE_BRANCH_CODE = '00000'

// Tax IDs are often written grouped ("0-1055-12345-67-8"); stored as digits
// only so the API's exact tax_id filter matches however it was typed.
export const normalizeTaxId = (value: string) => value.replace(/[\s-]/g, '')

export const isValidThaiTaxId = (value: string) => {
  const digits = normalizeTaxId(value)
  if (!/^\d{13}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (13 - i)
  return (11 - (sum % 11)) % 10 === Number(digits[12])
}

export const isFiveDigitCode = (value: string) => /^\d{5}$/.test(value)

// Warns (never blocks) when another Company already has the typed tax_id
// and branch_code — the same buyer entered twice. Different branches of one
// tax ID are legitimately separate Companies, so with a branch typed only
// that exact branch counts; with no branch, any Company with the tax ID does.
// excludeId skips the Company being edited.
export function useCompanyTaxIdDuplicate (taxId: Ref<string>, branchCode: Ref<string>, excludeId?: number) {
  const companiesStore = useCompaniesStore()
  const duplicate = ref<Company | null>(null)
  let requestId = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  watch([taxId, branchCode], ([tax, branch]) => {
    clearTimeout(timer)
    const id = ++requestId
    if (!isValidThaiTaxId(tax) || (branch && !isFiveDigitCode(branch))) {
      duplicate.value = null
      return
    }
    timer = setTimeout(async () => {
      try {
        const match = await companiesStore.findByTaxId(normalizeTaxId(tax), branch || undefined, excludeId)
        if (id === requestId) duplicate.value = match
      } catch {
        // Advisory only — a failed lookup just shows no warning.
        if (id === requestId) duplicate.value = null
      }
    }, 400)
  }, { immediate: true })

  onScopeDispose(() => clearTimeout(timer))

  return { duplicate }
}
