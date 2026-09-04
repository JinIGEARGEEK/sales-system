<template>
  <div class="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] bg-white p-3 shadow-xl">
    <span class="text-sm font-medium text-[var(--color-black)]">
      {{ t('crm.components.bulkActionBar.selectedCount', { count: selectedIds.length, entity: entityLabel }) }}
    </span>

    <ButtonPrimary outline small fit-content icon="material-symbols:campaign-outline" :label="t('crm.components.campaignBulkActionBar.createCampaign')" data-cy="create-campaign-button" @click="emit('createCampaign')" />

    <ButtonPrimary cancel small fit-content :label="t('crm.components.bulkActionBar.cancel')" @click="emit('cancel')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// entityLabel is the caller's own crm.<entity>.index.entityLabel translation
// (Companies/Leads/Contacts each define one) — this bar is shared across
// all three list pages, so it no longer assumes Companies.
defineProps<{
  selectedIds: number[]
  entityLabel: string
}>()

const emit = defineEmits<{
  createCampaign: []
  cancel: []
}>()
</script>
