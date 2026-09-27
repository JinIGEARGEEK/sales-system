import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref } from 'vue'
import { apiResponse } from '../factories'

describe('Thai tax ID helpers', () => {
  it('accepts a 13-digit tax ID with a valid check digit, grouped or not', () => {
    expect(isValidThaiTaxId('0105512345671')).toBe(true)
    expect(isValidThaiTaxId('0-1055-12345-67-1')).toBe(true)
    expect(isValidThaiTaxId('0105 51234 5671')).toBe(true)
  })

  it('rejects a wrong check digit, a wrong length, or non-digits', () => {
    expect(isValidThaiTaxId('0105512345678')).toBe(false)
    expect(isValidThaiTaxId('010551234567')).toBe(false)
    expect(isValidThaiTaxId('01055123456711')).toBe(false)
    expect(isValidThaiTaxId('A105512345671')).toBe(false)
    expect(isValidThaiTaxId('')).toBe(false)
  })

  it('normalizes a tax ID to digits only', () => {
    expect(normalizeTaxId(' 0-1055-12345-67-1 ')).toBe('0105512345671')
    expect(normalizeTaxId('0\u20131055\u00a012345\u201367\u20131')).toBe('0105512345671')
  })

  it('checks five-digit branch/postal codes', () => {
    expect(isFiveDigitCode(HEAD_OFFICE_BRANCH_CODE)).toBe(true)
    expect(isFiveDigitCode('10110')).toBe(true)
    expect(isFiveDigitCode('1011')).toBe(false)
    expect(isFiveDigitCode('1011a')).toBe(false)
  })
})

describe('companiesStore.findByTaxId', () => {
  beforeEach(() => {
    useCompaniesStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('queries the exact tax_id/branch_code filter and skips the excluded Company', async () => {
    const get = vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse([
      { id: 7, name: 'Self', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
      { id: 9, name: 'Other', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
    ]))

    const match = await useCompaniesStore().findByTaxId('0105512345671', '00000', 7)

    expect(get).toHaveBeenCalledWith('/companies', { params: { tax_id: '0105512345671', branch_code: '00000', per_page: 50 } })
    expect(match?.id).toBe(9)
  })

  it('with no branch, prefers a Company that also has no branch', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse([
      { id: 3, name: 'Branch 1', branch_code: '00001', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
      { id: 4, name: 'No branch', branch_code: null, tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
    ]))
    expect((await useCompaniesStore().findByTaxId('0105512345671'))?.id).toBe(4)
  })

  it('with no branch and no branchless match, falls back to any Company with the tax ID', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse([
      { id: 3, name: 'Branch 1', branch_code: '00001', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
    ]))
    expect((await useCompaniesStore().findByTaxId('0105512345671'))?.id).toBe(3)
  })

  it('returns null when nothing else matches', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse([]))
    expect(await useCompaniesStore().findByTaxId('0105512345671')).toBeNull()
  })
})

describe('useCompanyTaxIdDuplicate', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // blocksSave mirrors the API's 409: only an exact tax ID + branch match
  // (a blank branch matching a blank one) blocks; anything else is advisory.
  it('flags an exact tax ID + branch match as blocking the save', async () => {
    vi.useFakeTimers()
    const findByTaxId = vi.spyOn(useCompaniesStore(), 'findByTaxId')
      .mockResolvedValue({ id: 9, name: 'Other', branch_code: '00000' } as Company)
    const taxId = ref('0105512345671')
    const branch = ref('00000')
    const scope = effectScope()
    const { duplicate, blocksSave } = scope.run(() => useCompanyTaxIdDuplicate(taxId, branch))!

    await vi.advanceTimersByTimeAsync(400)
    expect(duplicate.value?.id).toBe(9)
    expect(blocksSave.value).toBe(true)

    branch.value = ''
    await vi.advanceTimersByTimeAsync(400)
    expect(duplicate.value?.id).toBe(9)
    expect(blocksSave.value).toBe(false)

    findByTaxId.mockResolvedValue({ id: 9, name: 'Other', branch_code: null } as Company)
    taxId.value = '0-1055-12345-67-1'
    await vi.advanceTimersByTimeAsync(400)
    expect(blocksSave.value).toBe(true)

    scope.stop()
  })
})
