import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Mounts a throwaway dialog-like component that wires useAwaitableSubmit the
// way the modals do, with `onSubmit` bound as the caller's listener.
const mountWith = (onSubmit: (...args: unknown[]) => unknown, onFailure?: (error: unknown) => void) => {
  const close = vi.fn()
  let submitAndClose!: (...args: unknown[]) => Promise<boolean>
  const Dialog = defineComponent({
    emits: ['submit'],
    setup() {
      submitAndClose = useAwaitableSubmit(close, 'submit', onFailure)
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

  it('stays open and hands a submitFailure\'s error to onFailure (e.g. 422 field errors)', async () => {
    const err = new Error('422')
    const onFailure = vi.fn()
    const { close, submit } = mountWith(() => submitFailure(err), onFailure)
    await expect(submit()).resolves.toBe(false)
    expect(onFailure).toHaveBeenCalledWith(err)
    expect(close).not.toHaveBeenCalled()
  })

  it('still closes when a handler resolves some other value (e.g. the created record)', async () => {
    const onFailure = vi.fn()
    const { close, submit } = mountWith(() => ({ id: 1 }), onFailure)
    await expect(submit()).resolves.toBe(true)
    expect(close).toHaveBeenCalledOnce()
    expect(onFailure).not.toHaveBeenCalled()
  })
})
