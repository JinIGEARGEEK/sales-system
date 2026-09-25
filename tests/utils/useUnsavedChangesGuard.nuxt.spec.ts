import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// Captures the route-leave guard the composable registers, and stands in for
// Nuxt UI's useOverlay so each test decides what the styled
// LeaveConfirmModal "answers" (true = leave, false/undefined = stay).
const { leaveGuards, overlayAnswer, openCalls } = vi.hoisted(() => ({
  leaveGuards: [] as Array<() => unknown>,
  overlayAnswer: { value: undefined as boolean | undefined },
  openCalls: { count: 0 },
}))

mockNuxtImport('onBeforeRouteLeave', () => (guard: () => unknown) => { leaveGuards.push(guard) })
// Called outside a component here — no-op the beforeunload wiring's hooks.
mockNuxtImport('onMounted', () => () => {})
mockNuxtImport('onBeforeUnmount', () => () => {})
mockNuxtImport('useOverlay', () => () => ({
  create: () => ({
    open: () => {
      openCalls.count++
      const result = Promise.resolve(overlayAnswer.value)
      return Object.assign(result, { result })
    },
  }),
}))

const lastGuard = () => leaveGuards[leaveGuards.length - 1]!

describe('useUnsavedChangesGuard', () => {
  beforeEach(() => {
    leaveGuards.length = 0
    overlayAnswer.value = undefined
    openCalls.count = 0
  })

  it('lets navigation through without asking while the form is unchanged', async () => {
    const form = reactive({ name: '' })
    useUnsavedChangesGuard(() => form)

    expect(await lastGuard()()).toBeUndefined()
    expect(openCalls.count).toBe(0)
  })

  it('asks via the styled modal once dirty, and blocks when the user stays', async () => {
    const form = reactive({ name: '' })
    const { isDirty } = useUnsavedChangesGuard(() => form)
    form.name = 'Acme'

    expect(isDirty()).toBe(true)
    overlayAnswer.value = false
    expect(await lastGuard()()).toBe(false)
    expect(openCalls.count).toBe(1)
  })

  it('treats dismissing the modal (undefined) as staying', async () => {
    const form = reactive({ name: '' })
    useUnsavedChangesGuard(() => form)
    form.name = 'Acme'

    expect(await lastGuard()()).toBe(false)
  })

  it('allows navigation when the user chooses to leave', async () => {
    const form = reactive({ name: '' })
    useUnsavedChangesGuard(() => form)
    form.name = 'Acme'

    overlayAnswer.value = true
    expect(await lastGuard()()).toBeUndefined()
  })

  it('markClean re-baselines, so a just-loaded or just-saved form does not prompt', async () => {
    const form = reactive({ name: '' })
    const { markClean, isDirty } = useUnsavedChangesGuard(() => form)
    form.name = 'Loaded from API'
    markClean()

    expect(isDirty()).toBe(false)
    expect(await lastGuard()()).toBeUndefined()
    expect(openCalls.count).toBe(0)
  })
})
