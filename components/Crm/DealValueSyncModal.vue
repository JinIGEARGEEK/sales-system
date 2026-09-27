<template>
  <CrmConfirmDeleteModal
    :open="pending !== null"
    :title="t('crm.deals.detail.dealValueUpdateTitle')"
    :body="pending ? t('crm.deals.detail.dealValueUpdateBody', { from: currency(pending.from), to: currency(pending.to) }) : ''"
    :cancel-label="t('crm.deals.detail.dealValueUpdateDecline')"
    :confirm-label="t('crm.deals.detail.dealValueUpdateConfirm')"
    confirm-color="primary"
    @update:open="(value: boolean) => { if (!value) dismiss() }"
    @confirm="confirm"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// The "Update deal value?" confirm for a useQuoteDealValueSync() instance:
// open while it has a pending offer, confirm/dismiss through it.
const props = defineProps<{
  sync: QuoteDealValueSync
}>()

const { t } = useI18n()
const { currency } = useFormatter()
// Top-level bindings so the template unwraps the ref.
const { pending, confirm, dismiss } = props.sync
</script>
