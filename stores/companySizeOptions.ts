// Real API-backed store for the Admin-configurable Company size list
// (/admin/company-sizes) — replaces the previously free-text Company.size
// field as the source of truth for what sizes exist. Delete is a *soft*
// delete: the DELETE endpoint returns 204 and flips `is_active` to false
// server-side, so we patch that locally instead of splicing the record out.
const parseDates = (size: CompanySizeOption): CompanySizeOption => ({
  ...size,
  created_at: new Date(size.created_at),
})

// The API returns sizes sorted by name as text, which puts "1000+ คน" right
// after "1-10 คน". Order by headcount instead: each name's first number,
// with a leading ">" meaning "just above" it (so "> 100 คน" sits between
// 51-200 and 201-500). Names without a number (custom labels) go last,
// alphabetically.
const sizeRank = (name: string) => {
  const match = name.match(/(\d[\d,]*)/)
  if (!match) return Number.POSITIVE_INFINITY
  const value = Number(match[1]!.replace(/,/g, ''))
  return name.trimStart().startsWith('>') ? value + 0.5 : value
}

export const compareCompanySizes = (a: string, b: string) =>
  sizeRank(a) - sizeRank(b) || a.localeCompare(b)

export const useCompanySizeOptionsStore = defineStore('companySizeOptions', {
  state: () => ({
    items: [] as CompanySizeOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .map(s => ({ label: s.name, value: s.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<CompanySizeOption[]>>('/admin/company-sizes')
      this.items = response.data.data.map(parseDates).sort((a, b) => compareCompanySizes(a.name, b.name))
      return this.items
    },
    async add (size: Omit<CompanySizeOption, 'id' | 'created_at'>): Promise<CompanySizeOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<CompanySizeOption>>('/admin/company-sizes', size)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<CompanySizeOption, 'id' | 'created_at'>>): Promise<CompanySizeOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<CompanySizeOption>>(`/admin/company-sizes/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/company-sizes/${id}`)
      const size = this.items.find(s => s.id === id)
      if (size) size.is_active = false
    },
  },
})
