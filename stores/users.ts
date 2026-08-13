import { MOCK_USERS } from '~/constants/mockData'
import { nextId } from './helpers'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [...MOCK_USERS] as AdminUser[],
  }),
  actions: {
    add (user: Omit<AdminUser, 'id'>): number {
      const id = nextId(this.items)
      this.items.push({ ...user, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(u => u.id !== id)
    },
  },
})
