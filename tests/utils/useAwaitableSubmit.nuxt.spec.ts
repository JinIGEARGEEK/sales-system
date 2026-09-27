import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Mounts a throwaway dialog-like component that wires useAwaitableSubmit the
// way the modals do, with `onSubmit` bound as the caller's listener.
const mountWith = (onSubmit: (...args: unknown[]) => unknown) => {
  const close = vi.fn()
  let submitAndClose!: (...args: unknown[]) => Promise<boolean>
  const Dialog = defineComponent({
    emits: ['submit'],
    setup() {
      submitAndClose = useAwaitableSubmit(close)
      return () => h('div')
    },
  })
  mount(Dialog, { props: { onSubmit } })
  return { close, submit: (...args: unknown[]) => submitAndClose(...args) }
}

describe('useAwaitableSubmit', () => {
  it('awaits the handler with the payload, then closes and resolves true', async () => {
    let resolveHandler: () => void = () => {}
    const handler = vi.fn(() => new Promise<void>((resolve) => { resolveHandler = resolve }))
    const { close, submit } = mountWith(handler)

    const pending = submit({ name: 'x' }, 2)
    expect(handler).toHaveBeenCalledWith({ name: 'x' }, 2)
    expect(close).not.toHaveBeenCalled()
    resolveHandler()
    await expect(pending).resolves.toBe(true)
    expect(close).toHaveBeenCalledOnce()
  })

  it('stays open and resolves false when the handler resolves false', async () => {
    const { close, submit } = mountWith(() => false)
    await expect(submit()).resolves.toBe(false)
    expect(close).not.toHaveBeenCalled()
  })

  it('stays open and propagates the error when the handler throws', async () => {
    const { close, submit } = mountWith(async () => { throw new Error('boom') })
    await expect(submit()).rejects.toThrow('boom')
    expect(close).not.toHaveBeenCalled()
  })
})
