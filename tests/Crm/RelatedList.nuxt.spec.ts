import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import RelatedList from '~/components/Crm/RelatedList.vue'

// mountSuspended doesn't install the i18n plugin (TableEmpty/ButtonPrimary
// call useI18n); same stub as tests/Table/Data.nuxt.spec.ts.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('CrmRelatedList', () => {
  it('shows the TableEmpty state with the given title when there are no items', async () => {
    const wrapper = await mountSuspended(RelatedList, {
      props: { title: 'Contacts', items: [], emptyTitle: 'No contacts yet' },
    })
    expect(wrapper.find('[data-cy="table-empty"]').text()).toContain('No contacts yet')
  })

  it('renders one row per item through the #row slot, with the shared row classes', async () => {
    const wrapper = await mountSuspended(RelatedList, {
      props: { title: 'Contacts', items: [{ id: 1, name: 'Ann' }, { id: 2, name: 'Bo' }] },
      slots: {
        row: ({ item, rowClass }: { item: unknown, rowClass: string }) => h('a', { class: rowClass }, (item as { name: string }).name),
      },
    })
    const rows = wrapper.findAll('li a')
    expect(rows.map(row => row.text())).toEqual(['Ann', 'Bo'])
    expect(rows[0]!.classes()).toContain('rounded-lg')
  })

  it('shows the Add button only with an addLabel, and emits add', async () => {
    const hidden = await mountSuspended(RelatedList, { props: { title: 'Projects' } })
    expect(hidden.find('button').exists()).toBe(false)

    const wrapper = await mountSuspended(RelatedList, { props: { title: 'Projects', addLabel: 'Add Project' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('add')).toHaveLength(1)
  })
})
