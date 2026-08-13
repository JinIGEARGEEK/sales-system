export default {
  pipelineBoard: {
    noItems: 'No items',
  },
  activityTimeline: {
    noActivity: 'No activity logged yet.',
    by: 'by',
  },
  confirmDeleteModal: {
    title: 'Confirm Delete',
    confirmQuestion: 'Are you sure you want to delete',
    cannotBeUndone: 'This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
  },
  lastContact: {
    never: 'Never contacted',
    today: 'Contacted today',
    daysAgo: '{days} days ago',
  },
  teamMemberSelect: {
    label: 'Assigned To',
    placeholder: 'Select a team member',
  },
  importModal: {
    title: 'Import from FlowAccount',
    description: 'Upload a FlowAccount contact book export (สมุดรายชื่อ) to bulk-create Companies and their contact person, tagged as Vendor or Customer.',
    chooseFile: 'Click to choose a file',
    acceptedFormats: 'CSV, XLS, or XLSX',
    previewSummary: '{rows} rows found.',
    previewCompanies: '{count} new companies to create ({existing} already exist and will be skipped)',
    previewContacts: '{count} contact people to create',
    previewSkipped: '{count} rows skipped (no company name)',
    errorNoHeader: 'Could not find the expected header row (ชื่อธุรกิจ/ชื่อบุคคล). Please check the file format.',
    errorNoRows: 'No usable rows found in this file.',
    errorParseFailed: 'Could not read this file. Please check it is a valid CSV, XLS, or XLSX export.',
    cancel: 'Cancel',
    confirmImport: 'Import',
  },
}
