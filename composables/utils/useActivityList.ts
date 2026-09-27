import { useI18n } from 'vue-i18n'

// Shared by the deal/company/contact detail pages' own Activity section, each
// logging against their own record via a fixed related_type/related_id pair
// — mirrors useTaskList.ts. The global /crm/activities list page instead uses
// AddActivityModal's own showRelatedPicker mode directly, since it has no
// single record already in context.
export const useActivityList = (relatedType: ActivityRelatedType, relatedId: number, addedMessageKey: string) => {
  const { t } = useI18n()
  const { logActivity } = useLogActivity()

  const addActivityOpen = ref(false)
  const openAddActivity = () => { addActivityOpen.value = true }

  // Resolves false on failure so CrmAddActivityModal stays open.
  const onSubmitActivity = (payload: ActivityFormSubmit) =>
    logActivity(relatedType, relatedId, payload, t(addedMessageKey))

  return { addActivityOpen, openAddActivity, onSubmitActivity }
}
