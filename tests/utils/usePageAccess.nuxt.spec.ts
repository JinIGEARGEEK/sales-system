import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

// usePageAccess -> useRole() calls useI18n(), which needs the full i18n
// plugin installed to resolve real translations — not provided by
// mountSuspended's isolated component-mount harness. Same gap and same fix
// as tests/AccessGate/AccessGate.nuxt.spec.ts (that file's own comment: "no
// other spec yet exercising an i18n-dependent component to have hit this" —
// this is that other spec). useRole()'s `t` only backs `roleLabel`, which
// none of these tests call, so the stub's return value doesn't matter here.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// usePageAccess/guardMounted rely on an active component instance (the watch
// inside guardMounted needs an effect scope), so — like the composable's own
// real call sites — these are exercised through a tiny host component
// rather than called at the top level of the test.
const makeHarness = (roles: Role[], onGuard?: () => void) => defineComponent({
  setup() {
    const { canAccess, guardMounted } = usePageAccess(...roles)
    if (onGuard) guardMounted(onGuard)
    return () => h('div', String(canAccess.value))
  },
})

describe('usePageAccess', () => {
  it('canAccess is false when the current role is not in the allowed list', async () => {
    useUserStore().role = 'Sales Rep'
    const wrapper = await mountSuspended(makeHarness(['Admin', 'Sales Manager']))
    expect(wrapper.text()).toBe('false')
  })

  it('canAccess is true when the current role is in the allowed list', async () => {
    useUserStore().role = 'Admin'
    const wrapper = await mountSuspended(makeHarness(['Admin', 'Sales Manager']))
    expect(wrapper.text()).toBe('true')
  })

  it('guardMounted calls its callback once access is already granted at mount time', async () => {
    useUserStore().role = 'Admin'
    const fn = vi.fn()
    await mountSuspended(makeHarness(['Admin'], fn))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('guardMounted does not call its callback while access is denied', async () => {
    useUserStore().role = 'Sales Rep'
    const fn = vi.fn()
    await mountSuspended(makeHarness(['Admin'], fn))
    expect(fn).not.toHaveBeenCalled()
  })
})
