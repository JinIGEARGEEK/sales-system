// Real API-backed store. Delete is a *soft* delete (§4 of api-system-spec.md):
// the DELETE endpoint returns 204 and flips `status` to 'inactive' server-side, so we
// patch that locally instead of splicing the record out of `items`.
const parseDates = (tag: Tag): Tag => ({
  ...tag,
  created_at: new Date(tag.created_at),
})

export const useTagsStore = defineStore('tags', {
  state: () => ({
    items: [] as Tag[],
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Tag[]>>('/tags', {
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    // Server-paginated fetch used by the Tags list page (search/filter/page all
    // round-trip to GET /tags), same pattern as Leads/Companies/Contacts'
    // fetchList — deliberately doesn't touch `items` above.
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Tag[]>>('/tags', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        totalPage: response.data.total_page,
      }
    },
    async add (tag: Omit<Tag, 'id' | 'created_at'>): Promise<Tag> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Tag>>('/tags', tag)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Tag, 'id' | 'created_at'>>): Promise<Tag> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Tag>>(`/tags/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(tg => tg.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/tags/${id}`)
      const tag = this.items.find(tg => tg.id === id)
      if (tag) tag.status = 'inactive' as TagStatus
    },
  },
})
