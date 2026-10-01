import { USER_ROLES } from '../roles'

// The Users list's role filter. Labels are the API's role names, matching the
// role badges in the table.
export const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  ...USER_ROLES.map(role => ({ label: role, value: role })),
]

export const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]
