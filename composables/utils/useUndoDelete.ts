import { MANAGER_ROLES } from '~/constants/roles'

// Single-record counterpart of useBulkArchiveUndo: Deal/Lead/Company/Contact
// deletes are soft-deletes (the row moves to Trash), so the success toast
// offers an inline "Undo" that calls the same per-item `restore` the Trash
// page uses — no trip to Admin > Trash for an accidental delete.
//
// The backend gates every `POST /<entity>/:id/restore` behind `bulkRoles`
// (Admin/Sales Manager, internal/routes/routes.go) — the same group that can
// see the Trash page at all — so the Undo action is only offered to those
// roles. Everyone else still gets the "moved to Trash" confirmation (a
// manager can restore it for them), just without a button that would 403.
export const useUndoDelete = () => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const { hasRole } = useRole()

  const canUndo = computed(() => hasRole(...MANAGER_ROLES))

  const notifyDeletedWithUndo = <T>(options: {
    id: number
    name: string
    restore: (id: number) => Promise<T>
    // Called after a successful restore — e.g. refetch the list the row was
    // deleted from, or navigate back to the restored record's detail page.
    onRestored?: () => Promise<void> | void
  }) => {
    const message = t('global.undoDelete.deleted', { name: options.name })
    if (!canUndo.value) {
      success(message)
      return
    }
    success(message, {
      label: t('global.undoDelete.undo'),
      onClick: async () => {
        try {
          await options.restore(options.id)
          await options.onRestored?.()
          success(t('global.undoDelete.restored', { name: options.name }))
        } catch (err) {
          error(getApiErrorMessage(err, t('global.genericError')))
        }
      },
    })
  }

  return { notifyDeletedWithUndo, canUndo }
}
