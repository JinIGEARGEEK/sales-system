import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TableData from '~/components/Table/Data.vue'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

// Same reasoning as tests/AccessGate: mountSuspended doesn't install the i18n
// plugin, and these tests only care about selection, not labels.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const columns = [
  { label: '', field: 'select', type: TABLE_CARD_TYPE.SELECTED },
  { label: 'Name', field: 'name' },
]
const rows = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
]

// The mobile card list (md:hidden) is rendered in the DOM alongside the
// desktop table — happy-dom doesn't apply the breakpoint — so scope to it.
// Its first checkbox is Select all, then one per row.
const mobileCheckboxes = (component: Awaited<ReturnType<typeof mountSuspended>>) =>
  component.find('.md\\:hidden').findAll('[role="checkbox"]')

describe('TableData selection', () => {
  it('adds the tapped row on mobile instead of replacing the selection', async () => {
    const component = await mountSuspended(TableData, {
      props: { columns, rows, isShowSelect: true, selectValue: [] },
    })

    await mobileCheckboxes(component)[1]!.trigger('click')

    const emitted = component.emitted('update:selectValue')
    expect(emitted?.at(-1)?.[0]).toEqual([rows[0]])
  })

  it('shows Select all as indeterminate when only some rows are selected', async () => {
    const component = await mountSuspended(TableData, {
      props: { columns, rows, isShowSelect: true, selectValue: [] },
    })

    await mobileCheckboxes(component)[1]!.trigger('click')

    expect(mobileCheckboxes(component)[0]!.attributes('aria-checked')).toBe('mixed')
  })
})
