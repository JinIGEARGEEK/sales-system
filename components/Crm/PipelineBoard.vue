<template>
  <!-- Desktop/tablet: drag-and-drop columns side by side. Native HTML5 drag
       has no touch equivalent, so this view is hidden below md and replaced
       with a stacked, tap-driven layout instead of being offered unusably. -->
  <div class="hidden items-stretch gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
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
          class="flex min-h-[104px] cursor-grab flex-col justify-between rounded-lg border border-(--color-card-border) bg-white p-3 active:cursor-grabbing"
          @dragstart="onDragStart(item)"
          @click="emit('select', item)"
        >
          <slot name="card" :item="item" />
        </div>

        <div v-if="!grouped[column.value]?.length" class="py-4 text-center text-xs text-(--color-gray)">
          {{ t('crm.components.pipelineBoard.noItems') }}
        </div>

        <!-- Optional per-column "Load more" affordance (e.g. paginated Deals) —
             composed by the caller since only it knows loaded-vs-total counts. -->
        <slot name="column-footer" :column="column" />
      </div>
    </div>
  </div>

  <!-- Mobile: each stage is a collapsible section instead of a side-scrolling
       column, and moving a card between stages is a tap-and-pick (the per-card
       stage select below) instead of drag-and-drop. -->
  <div class="flex flex-col gap-3 md:hidden">
    <div
      v-for="column in columns"
      :key="column.value"
      class="overflow-hidden rounded-lg border"
      :style="{ borderColor: getColumnBorderTint(String(column.value)) }"
    >
      <button
        type="button"
        class="flex w-full items-start justify-between gap-2 px-3 py-2 backdrop-blur-2xl"
        :style="{ backgroundColor: getColumnHeaderTint(String(column.value)) }"
        @click="toggleExpanded(String(column.value))"
      >
        <div class="flex flex-col items-start">
          <span class="text-sm font-medium text-white">{{ column.label }}</span>
          <span class="text-[11px] text-white/70">{{ getStageDescription(String(column.value)) }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <span class="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium text-white">
            {{ columnCounts?.[column.value] ?? (grouped[column.value]?.length || 0) }}
          </span>
          <UIcon
            :name="isExpanded(String(column.value)) ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
            class="size-4 text-white"
          />
        </div>
      </button>

      <div
        v-show="isExpanded(String(column.value))"
        class="flex flex-col gap-2 p-3 backdrop-blur-xl"
        :style="{ backgroundColor: getColumnTint(String(column.value)) }"
      >
        <div
          v-for="item in grouped[column.value] || []"
          :key="`${item._type}-${item.id}`"
          class="flex flex-col gap-2 rounded-lg border border-(--color-card-border) bg-white p-3"
        >
          <div @click="emit('select', item)">
            <slot name="card" :item="item" />
          </div>
          <USelectMenu
            :model-value="column.value"
            :items="columns"
            value-key="value"
            label-key="label"
            size="xs"
            class="self-end"
            @update:model-value="(value) => onMobileMove(item, value)"
          />
        </div>

        <div v-if="!grouped[column.value]?.length" class="py-4 text-center text-xs text-(--color-gray)">
          {{ t('crm.components.pipelineBoard.noItems') }}
        </div>

        <slot name="column-footer" :column="column" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DEAL_STAGE_COLORS, PROSPECT_CONVERTED_STATUS } from '~/constants/mockData'

const { t } = useI18n()
const pipelineStagesStore = usePipelineStagesStore()
const prospectStagesStore = useProspectStagesStore()

// A card can be a Deal or a Lead being shown ahead of conversion (on the
// unified Deals board), or a Prospect on its own standalone board (§3.1a) —
// `_lane` is the column value it renders under, precomputed by the caller so
// this component never needs to know how a Lead/Prospect's status maps onto
// its board's columns.
type PipelineCard = { id: number, _type: 'deal', _lane: string } & Deal
  | { id: number, _type: 'lead', _lane: string } & Lead
  | { id: number, _type: 'prospect', _lane: string } & Prospect

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

// Legacy default-name descriptions, kept as a fallback for Prospect's four
// seeded stage names + the reserved "Converted" status — same accepted
// limitation Deal's STAGE_DESCRIPTION_KEYS already has: a custom Admin-added
// stage (Deal or Prospect) simply gets no subtitle, since stage config has no
// description field of its own.
const PROSPECT_STATUS_DESCRIPTION_KEYS: Record<string, string> = {
  New: 'prospectNew',
  Engaging: 'prospectEngaging',
  Nurturing: 'prospectNurturing',
  Disqualified: 'prospectDisqualified',
  Converted: 'prospectConverted',
}

const getStageDescription = (value: string) => {
  const key = STAGE_DESCRIPTION_KEYS[value as DealStage] || PROSPECT_STATUS_DESCRIPTION_KEYS[value]
  return key ? t(`crm.components.pipelineBoard.stageDescriptions.${key}`) : ''
}

const WON_COLOR = '#00C875'
const LOST_COLOR = '#E2445C'
// Legacy default colors, kept as a fallback for Prospect's four seeded stage
// names + the reserved "Converted" status (not a droppable column — see
// pages/crm/prospects/index.vue — but still needs a color in case a
// converted Prospect briefly renders before its card is removed from the
// board). A custom Admin-added Prospect stage has no per-stage color field
// (ProspectStage, unlike PipelineStage, has no won/lost-style flag to key
// off either — Prospect stages are a straight funnel sequence), so it falls
// through to FALLBACK_COLOR, same as an in-between (non-Won/Lost) custom
// Deal stage already does below.
const DEFAULT_PROSPECT_STAGE_COLORS: Record<string, string> = {
  New: '#5B5FE9',
  Engaging: '#4A9FE8',
  Nurturing: '#F5A623',
  Disqualified: '#E2445C',
  Converted: '#00C875',
}

// Prefers the hardcoded DEAL_STAGE_COLORS/DEFAULT_PROSPECT_STAGE_COLORS maps
// (kept for each board's default columns' exact existing look), then checks
// prospectStagesStore *before* pipelineStagesStore — a Prospect lane's value
// is never a Deal stage, but the two admin-configurable tables have no
// shared namespace, so if a custom Prospect stage happened to share a name
// with a custom Deal stage (e.g. both renamed to "Follow Up"), checking
// prospectStagesStore first stops that collision from leaking a Deal's Won/
// Lost color onto an unrelated Prospect column. Falls back to
// pipelineStagesStore's is_won_stage/is_lost_stage flags so a custom
// Admin-added Deal stage still renders sensibly (green/red/primary) without
// needing a per-stage hardcoded color.
const getColumnColor = (value: string) => {
  if (DEAL_STAGE_COLORS[value as DealStage]) return DEAL_STAGE_COLORS[value as DealStage]
  if (DEFAULT_PROSPECT_STAGE_COLORS[value]) return DEFAULT_PROSPECT_STAGE_COLORS[value]
  if (value === PROSPECT_CONVERTED_STATUS) return WON_COLOR
  const prospectStage = prospectStagesStore.byName(value)
  if (prospectStage) return prospectStage.is_disqualified_stage ? LOST_COLOR : FALLBACK_COLOR
  const dealStage = pipelineStagesStore.byName(value)
  if (dealStage?.is_won_stage) return WON_COLOR
  if (dealStage?.is_lost_stage) return LOST_COLOR
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

// Mobile sections default open (mirrors the desktop board showing every
// column at once) but can be collapsed to cut down scrolling on a long
// pipeline.
const collapsedColumns = ref(new Set<string>())
const isExpanded = (value: string) => !collapsedColumns.value.has(value)
const toggleExpanded = (value: string) => {
  if (collapsedColumns.value.has(value)) {
    collapsedColumns.value.delete(value)
  } else {
    collapsedColumns.value.add(value)
  }
}

const onMobileMove = (item: PipelineCard, value: string | number) => {
  if (String(value) !== item._lane) emit('move', item, String(value))
}
</script>
