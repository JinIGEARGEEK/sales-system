import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useModalForm } from '~/composables/utils/useModalForm'

// Stands in for Nuxt UI's useOverlay, so each test decides what the styled
// LeaveConfirmModal "answers" (true = discard, false/undefined = keep editing).
const { overlayAnswer, openCalls } = vi.hoisted(() => ({
  overlayAnswer: { value: undefined as boolean | undefined },
  openCalls: { count: 0 },
}))

mockNuxtImport('useOverlay', () => () => ({
  create: () => ({
    open: () => {
      openCalls.count++
      const result = Promise.resolve(overlayAnswer.value)
      return Object.assign(result, { result })
    },
  }),
}))
// useSubmitGuard's error toast needs a component setup context (useI18n).
mockNuxtImport('useApiErrorNotifier', () => () => ({ notifyApiError: vi.fn() }))

const setup = async () => {
  const open = ref(false)
  const emitOpen = vi.fn((value: boolean) => { open.value = value })
  const modal = useModalForm(() => open.value, () => ({ name: '' }))
  const onUpdateOpen = modal.guardDismiss(emitOpen)
  open.value = true
  await nextTick()
  await nextTick()
  return { open, emitOpen, onUpdateOpen, ...modal }
}

describe('useModalForm', () => {
  beforeEach(() => {
    overlayAnswer.value = undefined
    openCalls.count = 0
  })

  it('resets the form on open and closes without asking while untouched', async () => {
    const { form, onUpdateOpen, emitOpen } = await setup()
    expect(form.name).toBe('')

    await onUpdateOpen(false)
    expect(openCalls.count).toBe(0)
    expect(emitOpen).toHaveBeenCalledWith(false)
  })

  it('asks before discarding typed input, and stays open when the user keeps editing', async () => {
    const { form, onUpdateOpen, emitOpen, isDirty } = await setup()
    form.name = 'Acme'
    expect(isDirty()).toBe(true)

    overlayAnswer.value = false
    await onUpdateOpen(false)
    expect(openCalls.count).toBe(1)
    expect(emitOpen).not.toHaveBeenCalled()
  })

  it('closes once the user confirms discarding', async () => {
    const { form, onUpdateOpen, emitOpen } = await setup()
    form.name = 'Acme'

    overlayAnswer.value = true
    await onUpdateOpen(false)
    expect(emitOpen).toHaveBeenCalledWith(false)
  })

  it('never asks about the close that follows a guarded submit', async () => {
    const { form, onUpdateOpen, emitOpen, guard } = await setup()
    form.name = 'Acme'

    const submit = guard(async () => {
      await onUpdateOpen(false)
    })
    await submit()
    expect(openCalls.count).toBe(0)
    expect(emitOpen).toHaveBeenCalledWith(false)
  })

  it('treats a reopen as a fresh baseline', async () => {
    const { form, open, isDirty } = await setup()
    form.name = 'Acme'
    open.value = false
    await nextTick()
    open.value = true
    await nextTick()
    await nextTick()

    expect(form.name).toBe('')
    expect(isDirty()).toBe(false)
  })

  it('passes opening straight through', async () => {
    const { onUpdateOpen, emitOpen } = await setup()
    await onUpdateOpen(true)
    expect(emitOpen).toHaveBeenCalledWith(true)
    expect(openCalls.count).toBe(0)
  })
})
