<template>
  <!-- Reject the others (then accept), or Cancel/✕/Esc to not accept at
  all — the API allows one Accepted quote per Deal (409 otherwise). -->
  <UModal
    :open="pending !== null"
    :title="t('crm.quotes.supersede.title')"
    :description="t('crm.quotes.supersede.description')"
    @update:open="(value: boolean) => { if (!value) decide('cancel') }"
  >
    <template #body>
      <ul class="list-disc pl-5 text-sm" data-cy="supersede-quotes-list">
        <li v-for="quote in pending?.others ?? []" :key="quote.id">{{ quote.number || `#${quote.id}` }}</li>
      </ul>
    </template>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <ButtonPrimary :label="t('crm.quotes.supersede.cancel')" outline data-cy="supersede-cancel" @click="decide('cancel')" />
        <ButtonPrimary :label="t('crm.quotes.supersede.reject')" data-cy="supersede-reject" @click="decide('reject')" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// The "other quotes are already Accepted" question for a
// useSupersedeAcceptedQuotes() instance.
const props = defineProps<{
  supersede: SupersedeAcceptedQuotes
}>()

const { t } = useI18n()
// Top-level bindings so the template unwraps the ref.
const { pending, decide } = props.supersede
</script>
