export default {
  title: 'Trash',
  subtitle: 'Deleted or archived records — restore them here before they\'re gone for good.',
  tabs: {
    deals: 'Deals',
    leads: 'Leads',
  },
  columns: {
    deals: {
      title: 'Title',
      company: 'Company',
      value: 'Value',
      deletedAt: 'Deleted On',
      action: 'Action',
    },
    leads: {
      name: 'Name',
      company: 'Company',
      source: 'Source',
      deletedAt: 'Deleted On',
      action: 'Action',
    },
  },
  actions: {
    restore: 'Restore',
  },
  noAccess: 'You do not have permission to view this page.',
  restoreSuccess: '{entity} restored successfully',
  restoreError: 'Could not restore this record.',
}
