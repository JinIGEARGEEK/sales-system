import { useI18n } from 'vue-i18n'

// Bulk archive is a soft-delete (moves rows to Trash, recoverable via each
// store's per-item `restore`) — this adds an inline "Undo" action on the
// success toast so a user doesn't have to go find the Trash page to reverse
// an accidental bulk archive. Shared by the three list pages that expose a
// bulk-archive action (Leads, Prospects, Deals).
//
// `ids` must be the ids the server actually archived (BulkArchiveResult's
// `archived`), so Undo never "restores" a row that was never archived. Rows
// the server skipped (Deals only: a Won deal with money attached) go in
// `skipped` and get their own warning toast naming them and the reason.
export const useBulkArchiveUndo = () => {
  const { t, te } = useI18n()
  const { success, error, warning } = useNotify()

  const skipReasonText = (reason: string) => {
    const key = `crm.components.bulkActionBar.archiveSkipReason.${reason}`
    return te(key) ? t(key) : t('crm.components.bulkActionBar.archiveSkipReason.unknown')
  }

  const notifyArchivedWithUndo = <T>(options: {
    ids: number[]
    entity: string
    restore: (id: number) => Promise<T>
    refetch: () => Promise<void> | void
    skipped?: BulkArchiveSkip[]
    // Display name for a skipped id (falls back to "#id").
    nameOf?: (id: number) => string | undefined
  }) => {
    const ids = [...options.ids]
    if (ids.length > 0) {
      success(
        t('crm.components.bulkActionBar.archiveSuccess', { count: ids.length, entity: options.entity }),
        {
          label: t('crm.components.bulkActionBar.archiveUndo'),
          onClick: async () => {
            try {
              await Promise.all(ids.map(id => options.restore(id)))
              await options.refetch()
              success(t('crm.components.bulkActionBar.archiveRestoreSuccess', { count: ids.length, entity: options.entity }))
            } catch (err) {
              error(getApiErrorMessage(err, t('global.genericError')))
            }
          },
        },
      )
    }

    const skipped = options.skipped ?? []
    if (skipped.length === 0) return
    const names = skipped.map(s => options.nameOf?.(s.id) || `#${s.id}`).join(', ')
    const reasons = [...new Set(skipped.map(s => skipReasonText(s.reason)))].join(' ')
    warning(`${t('crm.components.bulkActionBar.archiveSkipped', { count: skipped.length, entity: options.entity, names })}. ${reasons}`)
  }

  return { notifyArchivedWithUndo }
}
