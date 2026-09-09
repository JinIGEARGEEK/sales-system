<template>
  <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{ content: 'w-56' }">
    <UButton
      :variant="isFocused ? 'soft' : 'ghost'"
      :color="isFocused ? 'warning' : 'neutral'"
      size="md"
      trailing-icon="material-symbols:keyboard-arrow-down-rounded"
      class="role-focus-trigger gap-2 rounded-full px-3 font-semibold transition-colors"
      :class="isFocused
        ? 'role-focus-trigger-active'
        : 'role-focus-trigger-idle border border-white/20 bg-white/10 text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] backdrop-blur-md hover:bg-white/20'"
      :aria-label="isFocused ? t('layout.roleFocus.triggerActiveLabel', { role: triggerLabel }) : t('layout.roleFocus.trigger')"
      data-cy="role-focus-switcher"
    >
      <span v-if="isFocused" class="role-focus-trigger-dot" aria-hidden="true" />
      <UIcon name="material-symbols:switch-account-outline" class="size-4" />
      <span class="max-w-24 truncate sm:max-w-none">{{ triggerLabel }}</span>
    </UButton>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FOCUSABLE_ROLES } from '~/constants/roles'

// Admin-only "use as" gimmick — temporarily narrows nav/UI down to another
// role's experience (via userStore.focusRole -> effectiveRole ->
// useRole.hasRole) so an Admin/lead helping out a team can work the app the
// way that team does, without actually changing their account's real role
// or permissions. Only ever mounted behind an `isAdmin` guard (see
// layouts/default.vue) — userStore.setFocusRole itself also no-ops for any
// other role, so this component doesn't re-check that on its own.
const { t } = useI18n()
const { roleLabel } = useRole()
const userStore = useUserStore()
const { focusRole } = storeToRefs(userStore)

const isFocused = computed(() => focusRole.value !== null)
const triggerLabel = computed(() => isFocused.value ? roleLabel(focusRole.value as Role) : t('layout.roleFocus.trigger'))

const menuItems = computed(() => [[
  {
    label: t('layout.roleFocus.exit'),
    icon: 'material-symbols:admin-panel-settings-outline',
    disabled: !isFocused.value,
    onSelect: () => userStore.setFocusRole(null),
  },
], FOCUSABLE_ROLES.map(r => ({
  label: roleLabel(r),
  icon: focusRole.value === r ? 'material-symbols:radio-button-checked' : 'material-symbols:radio-button-unchecked',
  // Navigate home on switch — staying put risked landing the Admin on a
  // page the newly-focused role can't see (e.g. focusing Sales Rep while
  // sitting on /admin/users), which AccessGate would immediately cover with
  // a "no access" alert instead of the page they meant to explore. Not
  // needed on Exit above: full Admin access is always valid wherever they
  // already are.
  onSelect: () => { userStore.setFocusRole(r); navigateTo('/') },
}))])
</script>

<style scoped>
/*
 * UButton's soft+warning variant already sets bg/text from the warning
 * palette; this layer only adds the "currently impersonating" affordance
 * that variant/color props can't express — a static status dot (no pulse,
 * that read as too attention-grabbing for a persistent header element).
 */
.role-focus-trigger-active {
  border: 1px solid color-mix(in srgb, var(--color-warning-toast) 35%, transparent);
}

.role-focus-trigger-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: currentColor;
}
</style>
