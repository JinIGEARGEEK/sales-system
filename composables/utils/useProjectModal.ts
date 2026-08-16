import { useI18n } from 'vue-i18n'

interface ProjectSavePayload {
  status: ProjectStatus
  production_reference: string | null
  name?: string
  target_end_date?: Date | null
  notes?: string
  company_id?: number
  deal_id?: number | null
}

// Shared by the Company detail page's Projects tab and the cross-company
// Projects list, which each open the same CrmAddProjectModal for add/edit.
// defaultCompanyId is used on create when the modal doesn't supply its own
// company_id (i.e. everywhere except the cross-company list, where the modal
// carries a Company picker instead).
export const useProjectModal = (defaultCompanyId: number | null, addedMessageKey: string, updatedMessageKey: string) => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const projectsStore = useProjectsStore()

  const open = ref(false)
  const editing = ref<Project | null>(null)

  const openAdd = () => {
    editing.value = null
    open.value = true
  }

  const openEdit = (project: Project) => {
    editing.value = project
    open.value = true
  }

  const onSave = async (payload: ProjectSavePayload) => {
    try {
      if (editing.value) {
        // A Production-role edit only carries status/production_reference
        // (CrmAddProjectModal hides the rest) — passing payload through as-is
        // keeps that subset intact rather than assuming every field is present.
        await projectsStore.update(editing.value.id, payload)
        success(t(updatedMessageKey))
      } else {
        const companyId = payload.company_id ?? defaultCompanyId
        await projectsStore.add(companyId!, {
          deal_id: payload.deal_id ?? null,
          start_date: new Date(),
          name: payload.name!,
          target_end_date: payload.target_end_date ?? null,
          notes: payload.notes ?? '',
          status: payload.status,
          production_reference: payload.production_reference,
        })
        success(t(addedMessageKey))
      }
    } catch {
      error(t('global.genericError'))
    }
  }

  return { open, editing, openAdd, openEdit, onSave }
}
