import { useI18n } from 'vue-i18n'

// Saves what CrmAddActivityModal submits: the activity itself, then — when
// "Create follow-up task" was ticked — a Task on the same record, assigned to
// the current user. Shared by every place that hosts the modal
// (useActivityList for the detail pages, /crm/activities, the Overview
// Pipeline side panel) so the follow-up behaves the same everywhere.
//
// Resolves a submitFailure() only when the activity itself failed, which
// keeps the modal open with the form intact and its 422 fields on the inputs
// (useAwaitableSubmit). A follow-up that fails
// after the activity saved still resolves `true`: the activity exists, so a
// second Save would log it twice — the error toast says the task is missing.
export const useLogActivity = () => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const activitiesStore = useActivitiesStore()
  const tasksStore = useTasksStore()
  const userStore = useUserStore()

  const logActivity = async (
    relatedType: ActivityRelatedType,
    relatedId: number,
    payload: ActivityFormSubmit,
    successMessage: string,
  ): Promise<boolean | SubmitFailure> => {
    try {
      await activitiesStore.add({
        type: payload.type,
        subject: payload.subject,
        notes: payload.notes,
        created_at: payload.created_at,
        related_type: relatedType,
        related_id: relatedId,
      })
    } catch (err) {
      notifyApiError(err)
      return submitFailure(err)
    }

    if (!payload.followUp) {
      success(successMessage)
      return true
    }

    try {
      await tasksStore.add({
        related_type: relatedType,
        related_id: relatedId,
        title: payload.followUp.title,
        description: '',
        due_date: payload.followUp.due_date,
        priority: 'medium',
        assigned_to: userStore.id || null,
      })
      success(t('crm.components.addActivityModal.loggedWithFollowUp'))
    } catch {
      error(t('crm.components.addActivityModal.followUpFailed'))
    }
    return true
  }

  return { logActivity }
}
