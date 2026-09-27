import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

    expect(get).toHaveBeenCalledWith('/companies', { params: { tax_id: '0105512345671', branch_code: '00000', per_page: 2 } })
    expect(match?.id).toBe(9)
  })

  it('returns null when nothing else matches', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse([]))
    expect(await useCompaniesStore().findByTaxId('0105512345671')).toBeNull()
  })
})
