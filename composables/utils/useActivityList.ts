import { useI18n } from 'vue-i18n'

interface ActivityFormPayload {
  type: ActivityType
  subject: string
  notes: string
  created_at?: string
}

// Shared by the deal/company/contact detail pages' own Activity section, each
// logging against their own record via a fixed related_type/related_id pair
// — mirrors useTaskList.ts. The global /crm/activities list page instead uses
// AddActivityModal's own showRelatedPicker mode directly, since it has no
// single record already in context.
export const useActivityList = (relatedType: ActivityRelatedType, relatedId: number, addedMessageKey: string) => {
  const { t } = useI18n()
  const { success } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const activitiesStore = useActivitiesStore()

  const addActivityOpen = ref(false)
  const openAddActivity = () => { addActivityOpen.value = true }

  const onSubmitActivity = async (payload: ActivityFormPayload) => {
    try {
      await activitiesStore.add({ related_type: relatedType, related_id: relatedId, ...payload })
      success(t(addedMessageKey))
    } catch (err) {
      notifyApiError(err)
    }
  }

  return { addActivityOpen, openAddActivity, onSubmitActivity }
}
