import { MOCK_CONTACTS } from '~/constants/mockData'
import { nextId } from './helpers'

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    items: [...MOCK_CONTACTS] as Contact[],
  }),
  actions: {
    add (contact: Omit<Contact, 'id'>): number {
      const id = nextId(this.items)
      this.items.push({ ...contact, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(c => c.id !== id)
    },
  },
})
