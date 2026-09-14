import { describe, it, expect, vi } from 'vitest'

// useSubmitGuard -> useApiErrorNotifier() calls useI18n() — same mocking
// approach as tests/utils/useContractGate.nuxt.spec.ts. Only the
// no-own-try/catch fallback path below ever reaches `t`.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('useSubmitGuard', () => {
  it('sets loading to true while fn is in flight and back to false once it resolves', async () => {
    const { loading, guard } = useSubmitGuard()
    let resolveFn: () => void = () => {}
    const fn = vi.fn(() => new Promise<void>((resolve) => { resolveFn = resolve }))
    const run = guard(fn)

    const promise = run()
    expect(loading.value).toBe(true)
    resolveFn()
    await promise
    expect(loading.value).toBe(false)
  })

  it('ignores a second call while the first is still in flight (re-entry guard)', async () => {
    const { guard } = useSubmitGuard()
    let resolveFn: () => void = () => {}
    const fn = vi.fn(() => new Promise<void>((resolve) => { resolveFn = resolve }))
    const run = guard(fn)

    const first = run()
    run() // ignored — loading is already true
    expect(fn).toHaveBeenCalledTimes(1)
    resolveFn()
    await first
  })

  it('allows a new call once the previous one has finished', async () => {
    const { guard } = useSubmitGuard()
    const fn = vi.fn().mockResolvedValue(undefined)
    const run = guard(fn)

    await run()
    await run()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('passes arguments through to the wrapped function', async () => {
    const { guard } = useSubmitGuard()
    const fn = vi.fn().mockResolvedValue(undefined)
    const run = guard(fn)

    await run('a', 1)

    expect(fn).toHaveBeenCalledWith('a', 1)
  })

  it('resets loading to false even when fn throws, so a later call is not blocked forever', async () => {
    const { loading, guard } = useSubmitGuard()
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    const run = guard(fn)

    await run()

    expect(loading.value).toBe(false)
  })

  it('swallows an error from fn rather than rejecting the returned promise (safety-net catch)', async () => {
    const { guard } = useSubmitGuard()
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    const run = guard(fn)

    await expect(run()).resolves.toBeUndefined()
  })
})
