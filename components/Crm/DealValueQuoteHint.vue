<template>
  <p v-if="deal?.value_quote_id" class="flex items-center gap-1 text-xs text-(--color-gray)" data-cy="deal-value-quote-hint">
    <UIcon name="material-symbols:link" class="size-4 shrink-0" />
    <i18n-t keypath="crm.deals.detail.valueFromQuote" tag="span">
      <template #number>
        <NuxtLink :to="`/crm/quotes/${deal.value_quote_id}`" class="font-medium text-(--color-primary) hover:underline" data-cy="deal-value-quote-link">
          {{ deal.value_quote_number || `#${deal.value_quote_id}` }}
        </NuxtLink>
      </template>
    </i18n-t>
  </p>
</template>

<script setup lang="ts">
// "From accepted quote Q-…" under a Deal's value while the API keeps that
// value in step with the Deal's Accepted quote (Deal.value_quote_id), linking
// to the quote — the place to change the amount. Renders nothing otherwise.
defineProps<{
  deal: Pick<Deal, 'value_quote_id' | 'value_quote_number'> | null | undefined
}>()
</script>
