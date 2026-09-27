import { useI18n } from 'vue-i18n'

// Nudges a rep to take the next concrete step once a deal is Won, instead of a
// won deal silently sitting with no follow-up assigned to anyone. Called from
// useDealWonHandoff (every path into Won: detail Mark Won, the Overview save,
// the Kanban board, the Contract-Signed prompt). `target` overrides the
// setup-time deal for callers that don't have one fixed Deal in context (the
// Kanban board hands over whichever card was just dropped).
const WON_FOLLOWUP_DUE_DAYS = 3

export const useWonFollowUpTask = (dealId: number, deal: Ref<Deal | null>) => {
  const { t } = useI18n()
  const { info } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const tasksStore = useTasksStore()

  const createWonFollowUpTask = (target?: Deal) => {
    const wonDeal = target ?? deal.value
    if (!wonDeal) return
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + WON_FOLLOWUP_DUE_DAYS)
    tasksStore.add({
      related_type: 'deal',
      related_id: target?.id ?? dealId,
      title: t('crm.deals.detail.wonFollowUpTaskTitle'),
      description: '',
      due_date: dueDate,
      priority: 'medium',
      assigned_to: wonDeal.assigned_to,
    }).then(() => {
      info(t('crm.deals.detail.wonFollowUpTaskCreated'))
    }).catch(notifyApiError)
  }

  return { createWonFollowUpTask }
}
