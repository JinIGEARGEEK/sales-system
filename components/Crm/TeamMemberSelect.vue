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
  // Pass the record's stored owner on an edit (PUT) form for a Deal/Lead/
  // Prospect. A Sales Rep or Marketing user may then only keep that owner or
  // claim the record for themselves — never hand it to someone else or
  // unassign it (the API's CanSetAssignee, 403 otherwise) — so the choices
  // narrow to those two. Admin/Sales Manager keep the full list. Leave it
  // unset on create forms and anywhere the rule doesn't apply (Tasks).
  currentAssignee?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = computed(() => {
  if (props.currentAssignee === undefined || hasRole(...MANAGER_ROLES)) return teamMembersStore.options
  const allowed = new Set([String(userStore.id), ...(props.currentAssignee ? [String(props.currentAssignee)] : [])])
  return teamMembersStore.options.filter(option => allowed.has(option.value))
})
</script>
