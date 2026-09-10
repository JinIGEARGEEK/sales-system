const lang = {
  noData: 'No Data',
  loading: 'Loading...',
  genericError: 'Something went wrong. Please try again.',
  currencySymbol: '฿',
  previous: 'Previous',
  next: 'Next',
  backToHome: 'Back To Home',
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
    loginSuccess: 'Logged in successfully',
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
    changePasswordSuccess: 'Password changed successfully',
    changePasswordFailed: 'Could not change password',
  },
  table: {
    selectAll: 'Select All',
    pagination: {
      allItem: 'Total',
      rowPerPage: 'Rows per page',
    },
  },
  input: {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    searching: 'Searching...',
    noResults: 'No matches found',
  },
  sessionExpired: 'Your session has expired. Please sign in again.',
  unsavedChangesConfirm: 'You have unsaved changes. Leave this page and discard them?',
  draftFound: 'We found a draft you didn\'t finish. Restore it?',
  draftRestore: 'Restore draft',
}

export default lang
