// Real API-backed store. GET /attachments requires related_type+related_id together;
// items are cached per related record and merged into a single flat list, same
// pattern as stores/activities.ts. Covers Lead/Deal/Company/Project (api-system-spec.md §8.6).
const parseDates = (attachment: Attachment): Attachment => ({
  ...attachment,
  created_at: new Date(attachment.created_at),
})

export const useAttachmentsStore = defineStore('attachments', {
  state: () => ({
    items: [] as Attachment[],
  }),
  getters: {
    forRelated: state => (relatedType: AttachmentRelatedType, relatedId: number) => state.items
      .filter(a => a.related_type === relatedType && a.related_id === relatedId),
  },
  actions: {
    async fetchForRelated (relatedType: AttachmentRelatedType, relatedId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Attachment[]>>('/attachments', {
        params: { related_type: relatedType, related_id: relatedId, per_page: 1000 },
      })
      const fetched = response.data.data.map(parseDates)
      this.items = [
        ...this.items.filter(a => !(a.related_type === relatedType && a.related_id === relatedId)),
        ...fetched,
      ]
      return fetched
    },
    // Uploads a binary file (PDF/image/spreadsheet) via multipart/form-data.
    async addFile (relatedType: AttachmentRelatedType, relatedId: number, category: AttachmentCategory, file: File): Promise<Attachment> {
      const { $api } = useNuxtApp()
      const form = new FormData()
      form.append('related_type', relatedType)
      form.append('related_id', String(relatedId))
      form.append('category', category)
      form.append('file', file)
      const response = await $api.post<ApiResponse<Attachment>>('/attachments', form)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    // Links an external doc (Google Sheets/Docs/Drive) instead of uploading a file.
    async addLink (relatedType: AttachmentRelatedType, relatedId: number, category: AttachmentCategory, fileName: string, externalUrl: string): Promise<Attachment> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Attachment>>('/attachments', {
        related_type: relatedType, related_id: relatedId, category,
        file_name: fileName, external_url: externalUrl,
      })
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/attachments/${id}`)
      this.items = this.items.filter(a => a.id !== id)
    },
  },
})
