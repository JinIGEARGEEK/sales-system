import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AccessGate from '~/components/AccessGate.vue'

// AccessGate calls useI18n() directly (matching this codebase's convention),
// which needs the full i18n plugin installed to resolve real translations —
// not provided by mountSuspended's isolated component-mount harness (there's
// no other spec yet exercising an i18n-dependent component to have hit this).
// Mocking here keeps this a focused unit test of AccessGate's own
// canAccess/label/title logic rather than standing up the i18n plugin.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      'global.noAccess': 'You do not have permission to view this page.',
      'global.noAccessTitle': 'Access restricted',
    })[key] ?? key,
  }),
}))

describe('AccessGate Component Test', () => {
  it('hides slot content and shows the access-denied alert when canAccess is false', async () => {
    const component = await mountSuspended(AccessGate, {
      props: { canAccess: false },
      slots: { default: '<div>secret content</div>' },
    })
    expect(component.html()).not.toContain('secret content')
  })

  it('renders slot content and no alert when canAccess is true', async () => {
    const component = await mountSuspended(AccessGate, {
      props: { canAccess: true },
      slots: { default: '<div>secret content</div>' },
    })
    expect(component.html()).toContain('secret content')
  })

  it('falls back to the shared global.noAccess/noAccessTitle strings when no label/title is given', async () => {
    const component = await mountSuspended(AccessGate, {
      props: { canAccess: false },
    })
    expect(component.text()).toContain('You do not have permission to view this page.')
    expect(component.text()).toContain('Access restricted')
  })

  it('uses a custom label/title instead of the shared default when provided', async () => {
    const component = await mountSuspended(AccessGate, {
      props: { canAccess: false, label: 'Custom denied message', title: 'Custom denied title' },
    })
    expect(component.text()).toContain('Custom denied message')
    expect(component.text()).toContain('Custom denied title')
    expect(component.text()).not.toContain('You do not have permission to view this page.')
  })
})
