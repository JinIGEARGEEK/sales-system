<template>
  <CrmBulkActionBarShell :selected-ids="selectedIds" :entity-label="t('crm.companies.index.entityLabel')" @cancel="emit('cancel')">
    <ButtonPrimary outline small fit-content icon="material-symbols:campaign-outline" :label="t('crm.components.campaignBulkActionBar.createCampaign')" data-cy="create-campaign-button" @click="emit('createCampaign')" />
  </CrmBulkActionBarShell>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  selectedIds: number[]
}>()

const emit = defineEmits<{
  createCampaign: []
  cancel: []
}>()
</script>
