<template>
  <InputSelect
    :model-value="modelValue"
    :options="options"
    :label="label ?? t('crm.components.teamMemberSelect.label')"
    :placeholder="placeholder ?? t('crm.components.teamMemberSelect.placeholder')"
    :name="name"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'

const { t } = useI18n()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const userStore = useUserStore()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const props = defineProps<{
  modelValue: string
  name?: string
  label?: string
  placeholder?: string
  // Pass the record's stored owner on a Deal's edit (PUT) form. A Sales Rep
  // or Marketing user may then only keep that owner or claim the Deal for
  // themselves — never hand it to someone else or unassign it (the API's
  // CanSetAssignee, 403 otherwise) — so the choices narrow to those two.
  // Admin/Sales Manager keep the full list. Leave it unset on create forms
  // and where the API applies a different rule (Lead/Prospect PUT checks
  // CanWrite on the new owner instead; Tasks).
  currentAssignee?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Only members who may own a record (no Production, the API's 422), plus
// whoever the form already holds so an edit still shows a legacy owner.
const options = computed(() => {
  const all = teamMembersStore.assigneeOptions.some(option => option.value === props.modelValue)
    ? teamMembersStore.assigneeOptions
    : [...teamMembersStore.assigneeOptions, ...teamMembersStore.options.filter(option => option.value === props.modelValue)]
  if (props.currentAssignee === undefined || hasRole(...MANAGER_ROLES)) return all
  const allowed = new Set([String(userStore.id), ...(props.currentAssignee ? [String(props.currentAssignee)] : [])])
  return all.filter(option => allowed.has(option.value))
})
</script>
