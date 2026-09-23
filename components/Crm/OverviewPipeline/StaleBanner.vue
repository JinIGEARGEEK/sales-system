<template>
  <!-- Built from the app's own warning tokens rather than UAlert, whose
  warning/subtle variant renders low-contrast in this theme. -->
  <div
    class="flex flex-col gap-3 rounded-xl border border-(--color-warning-hover)/50 border-l-4 border-l-(--color-warning-hover) bg-(--color-warning-bg) px-4 py-3 sm:flex-row sm:items-center"
    role="status"
    data-cy="overview-stale-alert"
  >
    <span class="grid size-9 shrink-0 place-items-center rounded-full bg-(--color-warning-hover)/20 text-(--color-warning-hover)">
      <UIcon name="material-symbols:schedule-outline" class="size-5" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium text-(--color-black)">
        {{ t('crm.overviewPipeline.attention.staleDeals', { count: numberFormat(count), value: `${t('global.currencySymbol')}${priceFormatCompact(value)}`, days: OVERVIEW_STALE_DAYS }) }}
      </p>
      <p class="text-xs text-(--color-dark-gray)">{{ t('crm.overviewPipeline.attention.staleDealsHint') }}</p>
    </div>
    <ButtonPrimary outline icon="material-symbols:highlight-outline" :label="t('crm.overviewPipeline.attention.highlight')" @click="emit('highlight')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { OVERVIEW_STALE_DAYS } from '~/composables/utils/usePipelineOverview'

// "N open deals worth ฿X have sat in the same stage for more than 14 days",
// with a one-click way to highlight them on the board.
defineProps<{
  count: number
  value: number
}>()

const emit = defineEmits<{ highlight: [] }>()

const { t } = useI18n()
const { numberFormat, priceFormatCompact } = useFormatter()
</script>
