import { useI18n } from 'vue-i18n'

// Shared by the Deal detail page's Overview save (onSave) and header "Mark Won"
// (onMarkWon) actions — both can transition a deal into `won` status and, when
// they do, should nudge a rep to take the next concrete step instead of a won
// deal silently sitting with no follow-up assigned to anyone.
const WON_FOLLOWUP_DUE_DAYS = 3

export const useWonFollowUpTask = (dealId: number, deal: Ref<Deal | null>) => {
  const { t } = useI18n()
  const { info } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const tasksStore = useTasksStore()

  const createWonFollowUpTask = () => {
    if (!deal.value) return
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + WON_FOLLOWUP_DUE_DAYS)
    tasksStore.add({
      related_type: 'deal',
      related_id: dealId,
      title: t('crm.deals.detail.wonFollowUpTaskTitle'),
      due_date: dueDate,
      assigned_to: deal.value.assigned_to,
    }).then(() => {
      info(t('crm.deals.detail.wonFollowUpTaskCreated'))
    }).catch(notifyApiError)
  }

  return { createWonFollowUpTask }
}
