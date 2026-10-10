<template>
  <!-- A status badge that is also a select: colour-coded like the plain
  badge (leadStatusColor), saved on pick through PATCH /leads/:id/status,
  which touches only status, never the rest of the record. -->
  <USelect
    :model-value="lead.status"
    :items="LEAD_STATUS_FORM_OPTIONS"
    :color="leadStatusColor(lead.status)"
    variant="soft"
    size="xs"
    class="w-full max-w-36"
    :loading="saving"
    :disabled="saving"
    :aria-label="t('crm.leads.index.changeStatus', { name: lead.name })"
    :data-cy="`lead-status-select-${lead.id}`"
    @update:model-value="onChange"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEAD_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const props = defineProps<{
  lead: Lead
}>()

const emit = defineEmits<{
  updated: [lead: Lead]
}>()

const { t } = useI18n()
const { success, error } = useNotify()
const { leadStatusColor } = useLeadStatusColor()
const leadsStore = useLeadsStore()

const saving = ref(false)

const onChange = async (value: string | number) => {
  const status = value as LeadStatus
  if (status === props.lead.status || saving.value) return
  saving.value = true
  try {
    const updated = await leadsStore.updateStatus(props.lead.id, status)
    success(t('crm.leads.index.statusUpdated', { name: props.lead.name, status }))
    emit('updated', updated)
  } catch (err) {
    // The API's own reason (e.g. the 403 for a Sales Rep changing another
    // rep's Lead) rather than a generic failure.
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    saving.value = false
  }
}
</script>
