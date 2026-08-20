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
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    // Server-paginated fetch used by the Users list page (search/filter/page
    // all round-trip to GET /users), same pattern as Leads/Companies/Contacts'
    // fetchList — deliberately doesn't touch `items` above (that cache stays
    // the "up to 1000, everything" list the updated-by name lookup relies on).
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
  },
})
