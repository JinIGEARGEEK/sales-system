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
  // Receives the user's open records when this update takes them away
  // (deactivation, or a move to Production). The API ignores it otherwise.
  reassign_to?: number
}

type UserWriteResponse = AdminUser & {
  open_records?: OpenRecordCounts
  reassigned?: ReassignedRecords
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
    async update (id: number, form: UserForm): Promise<AdminUserWriteResult> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<UserWriteResponse>>(`/users/${id}`, form)
      const { open_records: openRecords, reassigned, ...user } = response.data.data
      const updated = parseDates(user)
      const index = this.items.findIndex(u => u.id === id)
      if (index !== -1) this.items[index] = updated
      return { user: updated, open_records: openRecords ?? null, reassigned: reassigned ?? null }
    },
    // 200 { id, open_records, reassigned? }; `reassignTo` goes in the query
    // string (the API also takes a JSON body, but some clients drop DELETE
    // bodies).
    async remove (id: number, reassignTo?: number): Promise<UserDeleteResult> {
      const { $api } = useNuxtApp()
      const response = await $api.delete<ApiResponse<UserDeleteResult>>(`/users/${id}`, {
        params: reassignTo ? { reassign_to: reassignTo } : undefined,
      })
      const user = this.items.find(u => u.id === id)
      if (user) user.is_active = false
      return response.data?.data ?? { id, open_records: { deals: 0, leads: 0, prospects: 0, tasks: 0, total: 0 } }
    },
    // Behind bulkActivate/bulkDeactivate below, mirroring the backend's
    // UserHandler.bulkSetActive (Admin only). bulk-deactivate answers 200 { open_records, reassigned } and takes an
    // optional reassign_to; bulk-activate still answers 204 (empty result).
    async bulkSetActive (ids: number[], active: boolean, reassignTo?: number): Promise<UserBulkDeactivateResult> {
      const { $api } = useNuxtApp()
      const body = !active && reassignTo ? { ids, reassign_to: reassignTo } : { ids }
      const response = await $api.patch<ApiResponse<UserBulkDeactivateResult> | ''>(`/users/bulk-${active ? 'activate' : 'deactivate'}`, body)
      for (const id of ids) {
        const user = this.items.find(u => u.id === id)
        if (user) user.is_active = active
      }
      const data = optionalResponseData(response.data)
      return { open_records: data?.open_records ?? [], reassigned: data?.reassigned ?? [] }
    },
    bulkActivate (ids: number[]) {
      return this.bulkSetActive(ids, true)
    },
    bulkDeactivate (ids: number[], reassignTo?: number) {
      return this.bulkSetActive(ids, false, reassignTo)
    },
  },
})
