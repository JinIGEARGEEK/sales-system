// Real API-backed store. Admin-only (GET/POST/PUT/DELETE /users). Delete is a
// *soft* delete server-side (sets is_active: false), so we patch that locally.
const parseNullableDate = (value: string | null) => (value ? new Date(value) : null)

const parseDates = (user: AdminUser): AdminUser => ({
  ...user,
  latest_login: parseNullableDate(user.latest_login as unknown as string | null),
  created_at: parseNullableDate(user.created_at as unknown as string | null),
  updated_at: parseNullableDate(user.updated_at as unknown as string | null),
  deleted_at: parseNullableDate(user.deleted_at as unknown as string | null),
})

interface UserForm {
  first_name: string
  last_name: string
  email: string
  tel: string
  password?: string
  role: string
  status: string
  notes: string
}

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [] as AdminUser[],
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<AdminUser[]>>('/users', {
        // 200 is the backend max; utils.Pagination resets anything larger to 20.
        params: { per_page: 200, ...params },
      })
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    // Server-paginated fetch used by the Users list page (search/filter/page
    // all round-trip to GET /users), same pattern as Leads/Companies/Contacts'
    // fetchList — deliberately doesn't touch `items` above (that cache stays
    // the "up to 200, everything" list the updated-by name lookup relies on).
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<AdminUser[]>>('/users', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        totalPage: response.data.total_page,
      }
    },
    async add (form: UserForm): Promise<AdminUser> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<AdminUser>>('/users', form)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, form: UserForm): Promise<AdminUser> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<AdminUser>>(`/users/${id}`, form)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(u => u.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/users/${id}`)
      const user = this.items.find(u => u.id === id)
      if (user) user.is_active = false
    },
    // Shared implementation behind bulkActivate/bulkDeactivate below, mirroring
    // the backend's own UserHandler.bulkSetActive (Admin only, same route-group
    // gate as every other /users endpoint) — the Users list has no assignee/
    // tags concept like Leads/Companies do, so an is_active toggle is the
    // natural bulk action here instead of reusing CrmBulkActionBar's
    // reassign/tag/archive shape.
    async bulkSetActive (ids: number[], active: boolean) {
      const { $api } = useNuxtApp()
      await $api.patch(`/users/bulk-${active ? 'activate' : 'deactivate'}`, { ids })
      for (const id of ids) {
        const user = this.items.find(u => u.id === id)
        if (user) user.is_active = active
      }
    },
    bulkActivate (ids: number[]) {
      return this.bulkSetActive(ids, true)
    },
    bulkDeactivate (ids: number[]) {
      return this.bulkSetActive(ids, false)
    },
  },
})
