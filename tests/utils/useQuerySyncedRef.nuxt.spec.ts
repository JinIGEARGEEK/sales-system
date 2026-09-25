import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'

// mountSuspended replaces the route itself (default '/'), so a seeded query
// has to go through its `route` option, not a router.replace beforehand.
const mountWithRef = async (key: string, defaultValue?: string, allowed?: string[], route = '/login') => {
  let synced!: Ref<string>
  const Harness = defineComponent({
    setup () {
      synced = useQuerySyncedRef(key, defaultValue, 0, allowed)
      return () => h('div', synced.value)
    },
  })
  const wrapper = await mountSuspended(Harness, { route })
  return { wrapper, synced: () => synced }
}

const settle = async () => {
  await nextTick()
  await flushPromises()
  await nextTick()
}

describe('useQuerySyncedRef', () => {
  // /login: a public route, so the global auth middleware doesn't redirect
  // the (signed-out) test router away and drop the query under test.
  beforeEach(async () => {
    await useRouter().replace({ path: '/login', query: {} })
    await settle()
  })

  it('seeds from the route query and falls back to the default', async () => {
    const { synced } = await mountWithRef('status', undefined, undefined, '/login?status=active')
    expect(synced().value).toBe('active')

    const { synced: other } = await mountWithRef('stage')
    expect(other().value).toBe('all')
  })

  it('writes changes back to the URL and drops the default value', async () => {
    const router = useRouter()
    const { synced } = await mountWithRef('status')
    // router.replace runs route middleware first, so the write lands a few
    // ticks later than settle() covers.
    synced().value = 'archived'
    await vi.waitFor(() => expect(router.currentRoute.value.query.status).toBe('archived'))

    synced().value = 'all'
    await vi.waitFor(() => expect(router.currentRoute.value.query.status).toBeUndefined())
  })

  it('follows the URL when the query changes without a remount (back/forward)', async () => {
    const router = useRouter()
    const { synced } = await mountWithRef('status')
    await router.push({ query: { status: 'archived' } })
    await settle()
    expect(synced().value).toBe('archived')

    await router.push({ query: {} })
    await settle()
    expect(synced().value).toBe('all')
    // Following the URL must not echo a write back into it.
    expect(router.currentRoute.value.query.status).toBeUndefined()
  })

  it('ignores URL values outside `allowed`', async () => {
    const { synced } = await mountWithRef('view', 'kanban', ['kanban', 'list'], '/login?view=bogus')
    expect(synced().value).toBe('kanban')
  })
})
