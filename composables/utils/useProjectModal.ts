import { useI18n } from 'vue-i18n'

// Shared by the Company detail page's Projects tab, the Contact detail page's
// Projects section, and the cross-company Projects list, which each open the
// same CrmAddProjectModal for add/edit. defaultCompanyId is used on create
// when the modal doesn't supply its own company_id (i.e. everywhere except
// the cross-company list, where the modal carries a Company picker instead).
// Accepts a Ref so callers whose company id comes from an async-loaded record
// (e.g. the Contact page's contact.company_id) can pass a computed() that
// resolves once that record arrives, rather than a value frozen at setup time.
export const useProjectModal = (defaultCompanyId: number | null | Ref<number | null>, addedMessageKey: string, updatedMessageKey: string) => {
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

  // Bind to CrmAddProjectModal's @submit: resolves the created/updated
  // Project, or a submitFailure() (the toast already covers it) so the modal
  // stays open with a 422's fields on its inputs (useAwaitableSubmit).
  const onSubmit = async (payload: ProjectModalPayload): Promise<Project | SubmitFailure> => {
    try {
      if (editing.value) {
        // A Production-role edit only carries status/production_reference
        // (CrmAddProjectModal hides the rest) — passing payload through as-is
        // keeps that subset intact rather than assuming every field is present.
        const updated = await projectsStore.update(editing.value.id, payload)
        success(t(updatedMessageKey))
        return updated
      } else {
        const companyId = payload.company_id ?? unref(defaultCompanyId)
        const created = await projectsStore.add(companyId!, {
          deal_id: payload.deal_id ?? null,
          start_date: new Date(),
          name: payload.name!,
          target_end_date: payload.target_end_date ?? null,
          expected_proposal_date: payload.expected_proposal_date ?? null,
          expected_start_date: payload.expected_start_date ?? null,
          notes: payload.notes ?? '',
          status: payload.status,
          production_reference: payload.production_reference,
        })
        success(t(addedMessageKey))
        return created
      }
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
      return submitFailure(err)
    }
  }

  // The same save for a caller that opened this modal to fill an unrelated
  // "pick a Project" field elsewhere (e.g. Deal/Lead/Prospect's Business Unit
  // item select) and selects the Project immediately — `false` on failure,
  // which also keeps the modal open.
  const onSave = async (payload: ProjectModalPayload): Promise<Project | false> => {
    const result = await onSubmit(payload)
    return 'submitFailed' in result ? false : result
  }

  return { open, editing, openAdd, openEdit, onSubmit, onSave }
}
