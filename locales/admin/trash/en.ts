export default {
  title: 'Trash',
  subtitle: 'Deleted or archived records — restore them here before they\'re gone for good.',
  tabs: {
    deals: 'Deals',
    leads: 'Leads',
    companies: 'Companies',
    contacts: 'Contacts',
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
    companies: {
      name: 'Name',
      industry: 'Industry',
      deletedAt: 'Deleted On',
      action: 'Action',
    },
    contacts: {
      name: 'Name',
      company: 'Company',
      email: 'Email',
      deletedAt: 'Deleted On',
      action: 'Action',
    },
  },
  actions: {
    restore: 'Restore',
  },
  restoreSuccess: '{entity} restored successfully',
  restoreError: 'Could not restore this record.',
}
