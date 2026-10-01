import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES, TASK_ROLES } from '~/constants/roles'

// "Log activity" / "Add task" for a list page's row menu (TableData action
// column): each opens the topbar Quick Add's modal (useQuickAdd) with the
// row's record already picked. Gated like Quick Add itself — activities to
// SALES_PIPELINE_ROLES, tasks to TASK_ROLES. Spread `rowQuickActions.value`
// into the column's `actions` and bind `@log-activity="onLogActivity"` /
// `@add-task="onAddTask"` on TableData.
export const useRowQuickActions = (type: ActivityRelatedType) => {
  const { t } = useI18n()
  const { hasRole } = useRole()
  const { openActivity, openTask } = useQuickAdd()

  const rowQuickActions = computed<TableDataColumnActions[]>(() => [
    ...(hasRole(...SALES_PIPELINE_ROLES)
      ? [{ label: t('crm.components.rowActions.logActivity'), emitName: 'logActivity', isBorderBottom: false }]
      : []),
    ...(hasRole(...TASK_ROLES)
      ? [{ label: t('crm.components.rowActions.addTask'), emitName: 'addTask', isBorderBottom: false }]
      : []),
  ])

  return {
    rowQuickActions,
    onLogActivity: (row: { id: number }) => openActivity({ type, id: row.id }),
    onAddTask: (row: { id: number }) => openTask({ type, id: row.id }),
  }
}
