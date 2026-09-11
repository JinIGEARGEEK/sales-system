// Real API-backed store for Admin-managed API keys (external-integration
// credentials for the backend's /open/* route group). Revoke, not delete —
// the row stays for its audit trail (who created it, who revoked it) same
// as every other soft-delete/deactivate resource in this app.
const parseDates = (key: APIKey): APIKey => ({
  ...key,
  last_used_at: key.last_used_at ? new Date(key.last_used_at) : null,
  revoked_at: key.revoked_at ? new Date(key.revoked_at as unknown as string) : null,
  created_at: new Date(key.created_at),
})

export const useApiKeysStore = defineStore('apiKeys', {
  state: () => ({
    items: [] as APIKey[],
  }),
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<APIKey[]>>('/admin/api-keys', {
        params: { per_page: 200 },
      })
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    // Returns the raw key alongside the created row's metadata — the ONLY
    // time the raw secret is ever available; the caller must show it to the
    // Admin immediately and can't fetch it again afterward.
    async add (payload: { name: string, owner_user_id: number }): Promise<{ apiKey: APIKey, key: string }> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<{ api_key: APIKey, key: string }>>('/admin/api-keys', payload)
      const apiKey = parseDates(response.data.data.api_key)
      this.items.unshift(apiKey)
      return { apiKey, key: response.data.data.key }
    },
    async revoke (id: number) {
      const { $api } = useNuxtApp()
      await $api.post(`/admin/api-keys/${id}/revoke`)
      const key = this.items.find(k => k.id === id)
      if (key) key.is_active = false
    },
  },
})
