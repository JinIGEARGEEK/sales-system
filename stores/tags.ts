import { MOCK_TAGS } from '~/constants/mockData'
import { nextId } from './helpers'

export const useTagsStore = defineStore('tags', {
  state: () => ({
    items: [...MOCK_TAGS] as Tag[],
  }),
  actions: {
    add (tag: Omit<Tag, 'id'>): number {
      const id = nextId(this.items)
      this.items.push({ ...tag, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(tg => tg.id !== id)
    },
  },
})
