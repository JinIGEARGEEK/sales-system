/**
 * Hardcoded system account for local development, used until a real
 * authentication API is wired up.
 */
export const DEV_ACCOUNT = {
  username: 'admin',
  password: 'admin123',
}

export const DEV_USER: User = {
  first_name: 'System',
  last_name: 'Admin',
  username: DEV_ACCOUNT.username,
  tel: '',
  email: 'admin@igeargeek.com',
  accepted_consent_id: null,
  is_active: true,
  latest_login: null,
  created_at: null,
  updated_at: null,
  deleted_at: null,
  created_by: 0,
  updated_by: 0,
  deleted_by: 0,
}
