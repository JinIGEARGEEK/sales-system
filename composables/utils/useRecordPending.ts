// Tracks a detail page's own record fetch, so the page can render
// DetailSkeleton while it's in flight and NotFoundState only once it has
// settled without a record (404 or failure):
//
//   <div v-if="record">…</div>
//   <DetailSkeleton v-else-if="recordPending" />
//   <NotFoundState v-else … />
//
// `pending` starts true because the first render happens before onMounted
// starts the fetch; when the record is already cached, `v-if="record"` wins
// anyway. Pass track() the fetch (already `.catch`-ed), or nothing when no
// fetch is needed.
export const useRecordPending = () => {
  const pending = ref(true)

  const track = async (request?: Promise<unknown>) => {
    try {
      await request
    } finally {
      pending.value = false
    }
  }

  return { pending, track }
}
