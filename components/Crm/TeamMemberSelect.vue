<template>
  <InputSelect
    :model-value="modelValue"
    :options="teamMembersStore.options"
    :label="label ?? t('crm.components.teamMemberSelect.label')"
    :placeholder="placeholder ?? t('crm.components.teamMemberSelect.placeholder')"
    :name="name"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

defineProps<{
  modelValue: string
  name?: string
  label?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
