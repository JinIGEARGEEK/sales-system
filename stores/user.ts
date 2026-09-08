export const useUserStore = defineStore('user', {
  state: (): User & { focusRole: Role | null } => {
    return {
      id: 0,
      first_name: '',
      last_name: '',
      tel: '',
      email: '',
      notes: '',
      accepted_consent_id: null,
      latest_login: null,
      is_active: false,
      must_change_password: false,
      role: 'Sales Rep',
      created_at: null,
      updated_at: null,
      deleted_at: null,
      created_by: 0,
      updated_by: 0,
      deleted_by: 0,
      // "View as" override — UI-only, Admin-only (see setFocusRole). Never
      // sent to the backend and never substituted for `role` anywhere that
      // isn't purely presentational; the backend keeps enforcing the real
      // `role` on every request regardless of this value.
      focusRole: null,
    }
  },
  getters: {
    // What role-gated UI (useRole's hasRole) should treat the user as.
    // Only Admin can be focused into another role's view — for every other
    // role this always falls back to the real `role`.
    effectiveRole: (state): Role => (state.role === 'Admin' ? (state.focusRole ?? state.role) : state.role),
  },
  actions: {
    setUser (user: User) {
      this.id = user.id
      this.first_name = user.first_name
      this.last_name = user.last_name
      this.tel = user.tel
      this.email = user.email
      this.notes = user.notes
      this.accepted_consent_id = user.accepted_consent_id
      this.latest_login = user.latest_login
      this.is_active = user.is_active
      this.must_change_password = user.must_change_password
      this.role = user.role
      this.created_at = user.created_at
      this.updated_at = user.updated_at
      this.deleted_at = user.deleted_at
      this.created_by = user.created_by
      this.updated_by = user.updated_by
      this.deleted_by = user.deleted_by
    },
    setFocusRole (role: Role | null) {
      if (this.role !== 'Admin') return
      this.focusRole = role
    },
  },
})
