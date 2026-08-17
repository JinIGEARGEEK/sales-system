<template>
  <div class="flex items-stretch gap-4 overflow-x-auto pb-2">
    <div
      v-for="column in columns"
      :key="column.value"
      class="flex w-64 shrink-0 flex-col overflow-hidden rounded-lg border shadow-xl"
      :style="{ borderColor: getColumnBorderTint(String(column.value)) }"
      @dragover.prevent
      @drop="onDrop(column.value)"
    >
      <div
        class="flex items-start justify-between gap-2 border-b border-white/40 px-3 py-2 backdrop-blur-2xl"
        :style="{ backgroundColor: getColumnHeaderTint(column.value) }"
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium text-white">{{ column.label }}</span>
          <span class="text-[11px] text-white/70">{{ getStageDescription(column.value) }}</span>
        </div>
        <span class="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium text-white">
          {{ columnCounts?.[column.value] ?? (grouped[column.value]?.length || 0) }}
        </span>
      </div>

      <div
        class="flex flex-1 flex-col gap-2 p-3 backdrop-blur-xl"
        :style="{ backgroundColor: getColumnTint(column.value) }"
      >
        <div
          v-for="item in grouped[column.value] || []"
          :key="`${item._type}-${item.id}`"
          draggable="true"
          class="flex min-h-[104px] cursor-grab flex-col justify-between rounded-lg border border-[var(--color-card-border)] bg-white p-3 active:cursor-grabbing"
          @dragstart="onDragStart(item)"
          @click="emit('select', item)"
        >
          <slot name="card" :item="item" />
        </div>

        <div v-if="!grouped[column.value]?.length" class="py-4 text-center text-xs text-[var(--color-gray)]">
          {{ t('crm.components.pipelineBoard.noItems') }}
        </div>

        <!-- Optional per-column "Load more" affordance (e.g. paginated Deals) —
             composed by the caller since only it knows loaded-vs-total counts. -->
        <slot name="column-footer" :column="column" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DEAL_STAGE_COLORS } from '~/constants/mockData'

const { t } = useI18n()
const pipelineStagesStore = usePipelineStagesStore()

// A card can be a Deal or a Lead being shown ahead of conversion — `_lane` is the
// column (DealStage value) it renders under, precomputed by the caller so this
// component never needs to know how a Lead's status maps onto Deal stages.
type PipelineCard = { id: number, _type: 'deal', _lane: string } & Deal
  | { id: number, _type: 'lead', _lane: string } & Lead

const props = defineProps<{
  columns: Select[]
  items: PipelineCard[]
  // Optional override for the header's count badge, keyed by column.value —
  // lets a caller show a server-side total (e.g. Deals paginated per stage)
  // instead of the number of items actually loaded/rendered in that column.
  // Falls back to grouped[column.value]?.length when a column is absent/undefined.
  columnCounts?: Record<string, number>
}>()

const FALLBACK_COLOR = 'var(--color-primary)'

// Column titles (column.label) stay in English regardless of locale — they're the
// DealStage display names. Only this short description underneath is translated.
const STAGE_DESCRIPTION_KEYS: Record<DealStage, string> = {
  Lead: 'lead',
  Qualified: 'qualified',
  'Proposal Sent': 'proposalSent',
  Negotiation: 'negotiation',
  Won: 'won',
  Lost: 'lost',
}

const getStageDescription = (value: string) => {
  const key = STAGE_DESCRIPTION_KEYS[value as DealStage]
  return key ? t(`crm.components.pipelineBoard.stageDescriptions.${key}`) : ''
}

const WON_COLOR = '#00C875'
const LOST_COLOR = '#E2445C'

// Prefers the hardcoded DEAL_STAGE_COLORS map (kept for the default stages'
// exact existing look), then falls back to the configured PipelineStage's
// is_won_stage/is_lost_stage flags so a custom Admin-added stage still renders
// sensibly (green/red/primary) without needing a per-stage hardcoded color.
const getColumnColor = (value: string) => {
  if (DEAL_STAGE_COLORS[value as DealStage]) return DEAL_STAGE_COLORS[value as DealStage]
  const row = pipelineStagesStore.byName(value)
  if (row?.is_won_stage) return WON_COLOR
  if (row?.is_lost_stage) return LOST_COLOR
  return FALLBACK_COLOR
}

const getColumnHeaderTint = (value: string) => `color-mix(in srgb, ${getColumnColor(value)} 80%, transparent)`

// A strong, saturated glass tint (not the old barely-there 14% wash) — each
// lane should read as its own colored panel at a glance, not a near-white
// card with a faint hint of hue. Kept slightly translucent (88%) so the
// backdrop-blur still shows some glass-through effect against the page.
const getColumnTint = (value: string) => {
  const solidTint = `color-mix(in srgb, ${getColumnColor(value)} 32%, white)`
  return `color-mix(in srgb, ${solidTint} 88%, transparent)`
}

const getColumnBorderTint = (value: string) => `color-mix(in srgb, ${getColumnColor(value)} 45%, transparent)`

const emit = defineEmits<{
  move: [item: PipelineCard, newValue: string]
  select: [item: PipelineCard]
}>()

const draggingItem = ref<PipelineCard | null>(null)

const grouped = computed(() => {
  const result: Record<string, PipelineCard[]> = {}
  for (const item of props.items) {
    (result[item._lane] ||= []).push(item)
  }
  return result
})

const onDragStart = (item: PipelineCard) => {
  draggingItem.value = item
}

const onDrop = (columnValue: string) => {
  if (draggingItem.value) {
    emit('move', draggingItem.value, columnValue)
    draggingItem.value = null
  }
}
</script>
