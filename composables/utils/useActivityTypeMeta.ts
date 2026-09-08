import { useI18n } from 'vue-i18n'

// Single source of truth for how an ActivityType renders — label, select
// options, and badge color — shared by AddActivityModal's "Type" picker and
// the /crm/activities list page's own type filter + table badge. Was two
// independent switch(ActivityType) statements (one per file) before this
// extraction, matching the narrower useDealStageColor/useQuoteStatusColor
// composables' role but also owning the label, since (unlike Deal stage or
// Quote status) ActivityType has no other localized-label source anywhere
// in the app.
export const useActivityTypeMeta = () => {
  const { t } = useI18n()

  const activityTypeLabel = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return t('crm.components.addActivityModal.typeCall')
      case 'email':
        return t('crm.components.addActivityModal.typeEmail')
      case 'meeting':
        return t('crm.components.addActivityModal.typeMeeting')
    }
  }

  const activityTypeBadgeColor = (type: ActivityType): 'info' | 'warning' | 'success' => {
    switch (type) {
      case 'call':
        return 'info'
      case 'email':
        return 'warning'
      case 'meeting':
        return 'success'
    }
  }

  const activityTypeOptions = computed<Select[]>(() => [
    { label: activityTypeLabel('call'), value: 'call' },
    { label: activityTypeLabel('email'), value: 'email' },
    { label: activityTypeLabel('meeting'), value: 'meeting' },
  ])

  return { activityTypeLabel, activityTypeBadgeColor, activityTypeOptions }
}
