import { useI18n } from 'vue-i18n'

// Nudges a rep to take the next concrete step once a deal is Won, instead of a
// won deal silently sitting with no follow-up assigned to anyone. Called from
// useDealWonHandoff, i.e. every path into Won: the detail page's Mark Won, the
// Overview save, a drop into Won on the Deals board (Deal or Lead), the
// Overview Pipeline panel's stage change, and the Contract-Signed prompt.
const WON_FOLLOWUP_DUE_DAYS = 3

export const useWonFollowUpTask = () => {
  const { t } = useI18n()
  const { info } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const tasksStore = useTasksStore()

  // Fire-and-forget: the stage move already succeeded, so a failed task only
  // gets its own error toast.
  const createWonFollowUpTask = (deal: Deal) => {
    tasksStore.add({
      related_type: 'deal',
      related_id: deal.id,
      title: t('crm.deals.detail.wonFollowUpTaskTitle'),
      description: '',
      due_date: addDays(new Date(), WON_FOLLOWUP_DUE_DAYS),
      priority: 'medium',
      assigned_to: deal.assigned_to,
    }).then(() => {
      info(t('crm.deals.detail.wonFollowUpTaskCreated'))
    }).catch(notifyApiError)
  }

  return { createWonFollowUpTask }
}
