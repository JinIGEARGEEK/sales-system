import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import QuoteItemsEditor from '~/components/Crm/QuoteItemsEditor.vue'

// QuoteItemsEditor calls useI18n() directly, which needs the full i18n
// plugin installed to resolve real translations — not provided by
// mountSuspended's isolated component-mount harness. Same mocking approach
// as tests/AccessGate/AccessGate.nuxt.spec.ts; `t` just echoes the key back
// since these tests only assert on structure/placeholders, not real copy.
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))

// Mounts with one item row, so InputFormField's vee-validate <Field>-wrapped
// inputs render. (Under @nuxt/test-utils 3 this crashed on Field's first,
// undefined-scope slot render and was skipped; it renders since 4.x.)
it('QuoteItemsEditor Component Test > renders an item row with its Field-wrapped inputs', async () => {
  // Same as below: keep the onMounted productsStore.fetchAll() off the network.
  vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue({
    data: { data: [], page: 1, per_page: 200, total: 0, total_page: 1, next: 0, prev: 0 },
  } as never)
  const component = await mountSuspended(QuoteItemsEditor, {
    props: {
      modelValue: [{ key: 1, description: '', qty: 1, price: 0, product_id: null, kind: 'scope', discount_percent: 0 }],
    },
  })
  expect(component.html()).toMatchSnapshot()
  vi.restoreAllMocks()
})

describe('QuoteItemsEditor Component Test', () => {
  it('shows the "no items" placeholder and no rows when modelValue is empty', async () => {
    // Mounting triggers the onMounted productsStore.fetchAll() fire-and-forget
    // call (real useNuxtApp().$api instance) — spied here so this test never
    // makes a real network request.
    vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue({
      data: { data: [], page: 1, per_page: 200, total: 0, total_page: 1, next: 0, prev: 0 },
    } as never)

    const component = await mountSuspended(QuoteItemsEditor, {
      props: { modelValue: [] },
    })
    expect(component.text()).toContain('crm.quotes.editor.noItems')

    vi.restoreAllMocks()
  })
})
