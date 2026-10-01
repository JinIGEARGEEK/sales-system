import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { apiResponse, apiError } from '../factories'
import MergeDuplicatesModal from '~/components/Crm/MergeDuplicatesModal.vue'

// mountSuspended doesn't install the i18n plugin; echo keys back. The real
// useToast stays intact.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, te: () => false }),
}))

const contact = (id: number, name: string, extra: Partial<Contact> = {}): Contact => ({
  id,
  company_id: 1,
  name,
  email: `${name.toLowerCase()}@example.com`,
  phone: '',
  role_title: '',
  tags: [],
  status: 'active',
  is_primary: false,
  created_at: new Date('2026-09-01T00:00:00Z'),
  ...extra,
})

// The dialog renders in a portal.
const body = () => document.body
const byCy = (cy: string) => body().querySelector<HTMLElement>(`[data-cy="${cy}"]`)
const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise(resolve => setTimeout(resolve, 0))
}

const mergeResult = (overrides: Partial<MergeResult<Contact>> = {}): MergeResult<Contact> => ({
  target: contact(5, 'Ann', { phone: '0812345678' }),
  moved: { deals: 2, activities: 3, tasks: 0, lead_referrals: 0, total: 5 },
  filled: ['phone'],
  conflicts: [],
  ...overrides,
})

describe('CrmMergeDuplicatesModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    useContactsStore().$reset()
    useToast().clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('searches, picks a duplicate (never this record), previews and merges into this one', async () => {
    const api = useNuxtApp().$api
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue(apiResponse([contact(5, 'Ann'), contact(9, 'Ann B.'), contact(12, 'Annie')]) as never)
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(apiResponse(mergeResult()) as never)
    useContactsStore().items = [contact(5, 'Ann'), contact(9, 'Ann B.')]

    const wrapper = await mountSuspended(MergeDuplicatesModal, {
      props: { open: true, entity: 'contact', target: { id: 5, name: 'Ann' } },
    })
    await flush()
    expect(byCy('merge-survivor')?.textContent).toContain('Ann')
    expect((byCy('merge-next') as HTMLButtonElement).disabled).toBe(true)

    const search = byCy('merge-search')!.querySelector('input') ?? byCy('merge-search') as HTMLInputElement
    ;(search as HTMLInputElement).value = 'ann'
    search.dispatchEvent(new Event('input'))
    await vi.advanceTimersByTimeAsync(350)
    await flush()

    expect(getSpy).toHaveBeenCalledWith('/contacts', { params: { search: 'ann', per_page: 10 } })
    // This record itself is never offered.
    expect(byCy('merge-result-5')).toBeNull()
    byCy('merge-result-9')!.click()
    await flush()
    expect(byCy('merge-source-9')).not.toBeNull()

    byCy('merge-next')!.click()
    await flush()
    expect(byCy('merge-review-survivor')?.textContent).toContain('Ann')
    expect(byCy('merge-review-effects')?.textContent).toContain('crm.components.mergeDuplicates.effects.trash')

    byCy('merge-confirm')!.click()
    await flush()

    expect(postSpy).toHaveBeenCalledWith('/contacts/5/merge', { source_ids: [9] })
    expect(wrapper.emitted('merged')?.[0]?.[1]).toBe(5)
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    // The source is in Trash now: gone from the store's cache.
    expect(useContactsStore().items.map(c => c.id)).toEqual([5])
    expect(useToast().toasts.value.map(toast => toast.title)).toEqual(['crm.components.mergeDuplicates.result.merged'])
  })

  it('lets the user pick the survivor among bulk-selected records, and lists conflicts', async () => {
    const postSpy = vi.spyOn(useNuxtApp().$api, 'post').mockResolvedValue(apiResponse(mergeResult({
      target: contact(9, 'Bo'),
      conflicts: [{ field: 'email', source_id: 4, value: 'old@example.com' }],
    })) as never)

    await mountSuspended(MergeDuplicatesModal, {
      props: { open: true, entity: 'contact', candidates: [{ id: 4, name: 'Al' }, { id: 9, name: 'Bo' }, { id: 11, name: 'Cy' }] },
    })
    await flush()

    // The first selected row stays by default; pick another.
    const radios = byCy('merge-survivor-picker')!.querySelectorAll<HTMLElement>('button[role="radio"]')
    expect(radios).toHaveLength(3)
    radios[1]!.click()
    await flush()

    byCy('merge-next')!.click()
    await flush()
    expect(byCy('merge-review-survivor')?.textContent).toContain('Bo')
    byCy('merge-confirm')!.click()
    await flush()

    expect(postSpy).toHaveBeenCalledWith('/contacts/9/merge', { source_ids: [4, 11] })
    expect(useToast().toasts.value.map(toast => toast.title)).toEqual([
      'crm.components.mergeDuplicates.result.merged',
      'crm.components.mergeDuplicates.result.conflicts',
    ])
  })

  it('stays open and says which records are gone on a 404', async () => {
    vi.spyOn(useNuxtApp().$api, 'post').mockRejectedValue(apiError(404, { code: 'NOT_FOUND', message: 'Contact not found: 11' }))

    const wrapper = await mountSuspended(MergeDuplicatesModal, {
      props: { open: true, entity: 'contact', candidates: [{ id: 4, name: 'Al' }, { id: 11, name: 'Cy' }] },
    })
    await flush()
    byCy('merge-next')!.click()
    await flush()
    byCy('merge-confirm')!.click()
    await flush()

    expect(wrapper.emitted('merged')).toBeUndefined()
    expect(byCy('merge-review')).not.toBeNull()
    expect(useToast().toasts.value.map(toast => toast.title)).toEqual(['crm.components.mergeDuplicates.errors.notFoundNames'])
  })
})
