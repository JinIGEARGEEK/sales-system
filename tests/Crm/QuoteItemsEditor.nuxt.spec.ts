import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import QuoteItemsEditor from '~/components/Crm/QuoteItemsEditor.vue'

// QuoteItemsEditor calls useI18n() directly, which needs the full i18n
// plugin installed to resolve real translations — not provided by
// mountSuspended's isolated component-mount harness. Same mocking approach
// as tests/AccessGate/AccessGate.nuxt.spec.ts; `t` just echoes the key back
// since these tests only assert on structure/placeholders, not real copy.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// Same pre-existing failure documented in tests/Input/Text.nuxt.spec.ts:
// InputFormField's <Field v-slot="{ field, errors }"> renders its default
// slot once with an undefined scope before vee-validate's Field resolves,
// and InputText/InputTextarea's own field-destructuring throws on that first
// render. With an empty `modelValue` (no item rows), QuoteItemsEditor never
// renders an InputText/InputTextarea/InputSelect at all, so mounting itself
// is fine — but the moment `modelValue` has at least one row (the only
// interesting case, since that's when the Field-wrapped inputs actually
// render), this hits the exact same crash, confirmed by reproducing it
// directly against this component. Skipped rather than silently left
// failing, same as the precedent file — needs the same vee-validate/Nuxt UI
// test-harness fix to un-skip.
it.skip('QuoteItemsEditor Component Test > renders an item row with its Field-wrapped inputs', async () => {
  const component = await mountSuspended(QuoteItemsEditor, {
    props: {
      modelValue: [{ key: 1, description: '', qty: 1, price: 0, product_id: null, kind: 'scope', discount_percent: 0 }],
    },
  })
  expect(component.html()).toMatchSnapshot()
})

// The empty-state render (no item rows, so no Field-wrapped input is ever
// mounted) doesn't hit that issue, so it's covered directly instead of
// skipped.
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
