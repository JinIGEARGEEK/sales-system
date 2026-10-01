const lang = {
  noData: 'No Data',
  allChannels: 'All Channels',
  loading: 'Loading...',
  genericError: 'Something went wrong. Please try again.',
  currencySymbol: '฿',
  previous: 'Previous',
  next: 'Next',
  backToHome: 'Back To Home',
  backToList: 'Back to list',
  back: 'Back',
  retry: 'Retry',
  goToStageSetting: 'Go to stage setting',
  // Shared default for <AccessGate> — pages/crm/reports/*.vue pass their own
  // more specific accessDeniedTitle/Message instead of these; admin-only
  // pages (Trash, Activity Log, Pipeline Config, Users) use these defaults.
  noAccessTitle: 'Access restricted',
  noAccess: 'You do not have permission to view this page.',
  updated: {
    updatedBy: 'Updated by',
  },
  auth: {
    signIn: 'Sign in',
    forgotPassword: 'Forgot Password?',
    loginSuccess: 'Logged in',
    loginFailed: 'Invalid email or password.',
    emailLabel: 'Email',
    emailPlaceholder: 'Email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Password',
    changePasswordTitle: 'Change Password',
    changePasswordSubtitle: 'This account is using an Admin-assigned password. Please set a new password before continuing.',
    currentPasswordLabel: 'Current Password',
    currentPasswordPlaceholder: 'Current password',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'New password (min. 8 characters)',
    confirmPasswordLabel: 'Confirm New Password',
    confirmPasswordPlaceholder: 'Confirm new password',
    updatePassword: 'Update Password',
    changePasswordSuccess: 'Password changed',
    changePasswordFailed: 'Could not change password',
  },
  table: {
    selectAll: 'Select All',
    selectAllRows: 'Select all rows',
    selectRow: 'Select row {n}',
    actions: 'Actions',
    empty: {
      filteredTitle: 'No results match your filters',
      filteredDescription: 'Try a different search, or clear the filters to see everything.',
      clearFilters: 'Clear filters',
    },
    pagination: {
      allItem: 'Total',
      rowPerPage: 'Rows per page',
      goToPage: 'Go to page',
    },
  },
  input: {
    datePlaceholder: 'DD/MM/YYYY (B.E.)',
    dateRangePlaceholder: 'DD/MM/YYYY - DD/MM/YYYY (B.E.)',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    searching: 'Searching...',
    noResults: 'No matches found',
  },
  apiFieldError: {
    invalid: 'This value is not valid.',
    required: 'This field is required.',
    duplicate: 'A record with this value already exists.',
    not_found: 'Not found.',
    exceeds_receivable: 'This is more than the customer still owes.',
  },
  sessionExpired: 'Your session has expired. Please sign in again.',
  unsavedChangesConfirm: 'You have unsaved changes. Leave this page and discard them?',
  leaveConfirm: {
    title: 'Discard unsaved changes?',
    stay: 'Keep editing',
    leave: 'Discard & leave',
  },
  undoDelete: {
    deleted: '{name} moved to Trash',
    undo: 'Undo',
    restored: '{name} restored',
  },
  moreFilters: 'More filters',
  unnamedCompany: '(Unnamed company)',
  fewerFilters: 'Fewer filters',
  draftFound: 'We found a draft you didn\'t finish. Restore it?',
  draftRestore: 'Restore draft',
  // Display labels for record statuses, shared by every badge, select and
  // table cell that shows one — read through the use*StatusColor composables'
  // *StatusLabel()/*StatusOptions, never printed as the raw enum value.
  status: {
    quote: {
      draft: 'Draft',
      sent: 'Sent',
      accepted: 'Accepted',
      rejected: 'Rejected',
      expired: 'Expired',
    },
    contract: {
      draft: 'Draft',
      sent: 'Sent',
      signed: 'Signed',
      expired: 'Expired',
    },
    project: {
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      onHold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    customerProduct: {
      interested: 'Interested',
      trial: 'Trial',
      active: 'Active',
      churned: 'Churned',
    },
  },
}

export default lang
