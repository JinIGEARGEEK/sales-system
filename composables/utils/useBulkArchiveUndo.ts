// Bulk archive is a soft-delete (moves rows to Trash, recoverable via each
// store's per-item `restore`) — this adds an inline "Undo" action on the
// success toast so a user doesn't have to go find the Trash page to reverse
// an accidental bulk archive. Shared by the three list pages that expose a
// bulk-archive action (Leads, Prospects, Deals).
export const useBulkArchiveUndo = () => {
  const { t } = useI18n()
  const { success, error } = useNotify()

  const notifyArchivedWithUndo = <T>(options: {
    ids: number[]
    entity: string
    restore: (id: number) => Promise<T>
    refetch: () => Promise<void> | void
  }) => {
    success(
      t('crm.components.bulkActionBar.archiveSuccess', { count: options.ids.length, entity: options.entity }),
      {
        label: t('crm.components.bulkActionBar.archiveUndo'),
        onClick: async () => {
          try {
            await Promise.all(options.ids.map(id => options.restore(id)))
            await options.refetch()
            success(t('crm.components.bulkActionBar.archiveRestoreSuccess', { count: options.ids.length, entity: options.entity }))
          } catch (err) {
            error(getApiErrorMessage(err, t('global.genericError')))
          }
        },
      },
    )
  }

  return { notifyArchivedWithUndo }
}
