<template>
  <InputSelect
    :model-value="modelValue"
    :options="TEAM_MEMBER_OPTIONS"
    :label="label ?? t('crm.components.teamMemberSelect.label')"
    :placeholder="placeholder ?? t('crm.components.teamMemberSelect.placeholder')"
    :name="name"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TEAM_MEMBER_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

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
