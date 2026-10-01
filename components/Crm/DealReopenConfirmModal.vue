<template>
  <!-- Moving a Won/Lost deal to an open stage reopens it (the API sets status
       open and clears lost_reason) — asked first. Open while both `deal` and
       `stage` are set; dismissing emits `cancel` and nothing moves. -->
  <CrmConfirmDeleteModal
    :open="Boolean(deal && stage)"
    :title="t('crm.deals.index.reopenConfirmTitle')"
    :body="deal && stage ? t(deal.status === 'won' ? 'crm.deals.index.reopenConfirmBodyWon' : 'crm.deals.index.reopenConfirmBodyLost', { title: deal.title, stage }) : ''"
    :confirm-label="t('crm.deals.index.reopenConfirm')"
    confirm-color="primary"
    @update:open="(value: boolean) => { if (!value) emit('cancel') }"
    @confirm="emitConfirm"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  deal: Pick<Deal, 'title' | 'status'> | null | undefined
  // The open stage the deal would move to.
  stage: string | null | undefined
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const { t } = useI18n()
const emitConfirm = useAwaitableEmit('confirm')
</script>
