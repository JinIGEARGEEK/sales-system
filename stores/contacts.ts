import { MOCK_CONTACTS } from '~/constants/mockData'

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    items: [...MOCK_CONTACTS] as Contact[],
  }),
  actions: {
    add (contact: Omit<Contact, 'id'>): number {
      const id = Math.max(0, ...this.items.map(c => c.id)) + 1
      this.items.push({ ...contact, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(c => c.id !== id)
    },
  },
})
