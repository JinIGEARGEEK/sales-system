import { MOCK_COMPANIES } from '~/constants/mockData'

export const useCompaniesStore = defineStore('companies', {
  state: () => ({
    items: [...MOCK_COMPANIES] as Company[],
  }),
  getters: {
    nameById: state => (id: number) => state.items.find(c => c.id === id)?.name || '-',
    findByName: state => (name: string) => state.items.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
  },
  actions: {
    add (company: Omit<Company, 'id'>): number {
      const id = Math.max(0, ...this.items.map(c => c.id)) + 1
      this.items.push({ ...company, id })
      return id
    },
    addTag (id: number, tag: string) {
      const company = this.items.find(c => c.id === id)
      if (company && !company.tags.includes(tag)) {
        company.tags.push(tag)
      }
    },
    remove (id: number) {
      this.items = this.items.filter(c => c.id !== id)
    },
  },
})
