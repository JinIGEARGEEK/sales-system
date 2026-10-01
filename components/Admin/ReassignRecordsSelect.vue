<template>
  <!-- "Reassign open records to…" for deactivate / delete / bulk deactivate /
  move to Production. The API moves the user's open Deals, Leads, Prospects
  and pending Tasks to the pick in the same transaction; "keep" leaves them
  with the user (the result toast then says how many remain). -->
  <div class="text-left" data-cy="reassign-records-select">
    <InputSelect
      :model-value="modelValue"
      :options="options"
      :label="t('admin.users.reassign.label')"
      name="reassign_to"
      @update:model-value="emit('update:modelValue', String($event ?? KEEP_RECORDS))"
    />
    <p class="mt-1 text-xs text-(--color-gray)">{{ t('admin.users.reassign.hint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { KEEP_RECORDS } from '~/composables/utils/useUserRecordsReassign'

const { t } = useI18n()
const { reassignOptions } = useUserRecordsReassign()

const props = defineProps<{
  modelValue: string
  // The user(s) being removed — never a valid recipient.
  excludeIds: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = computed(() => reassignOptions(props.excludeIds))
</script>
