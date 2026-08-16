<template>
  <div class="flex items-stretch gap-4 overflow-x-auto pb-2">
    <div
      v-for="column in columns"
      :key="column.value"
      class="flex w-64 shrink-0 flex-col overflow-hidden rounded-lg border border-white/70 shadow-xl"
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
          {{ grouped[column.value]?.length || 0 }}
        </span>
      </div>

      <div
        class="flex flex-1 flex-col gap-2 p-3 backdrop-blur-xl"
        :style="{ backgroundColor: getColumnTint(column.value) }"
      >
        <div
          v-for="item in grouped[column.value] || []"
          :key="item.id"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DEAL_STAGE_COLORS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  columns: Select[]
  items: Deal[]
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

const getColumnColor = (value: string) => DEAL_STAGE_COLORS[value as DealStage] || FALLBACK_COLOR

const getColumnHeaderTint = (value: string) => `color-mix(in srgb, ${getColumnColor(value)} 80%, transparent)`

const getColumnTint = (value: string) => {
  const solidTint = `color-mix(in srgb, ${getColumnColor(value)} 14%, white)`
  return `color-mix(in srgb, ${solidTint} 92%, transparent)`
}

const emit = defineEmits<{
  move: [item: Deal, newValue: string]
  select: [item: Deal]
}>()

const draggingItem = ref<Deal | null>(null)

const grouped = computed(() => {
  const result: Record<string, Deal[]> = {}
  for (const item of props.items) {
    (result[item.stage] ||= []).push(item)
  }
  return result
})

const onDragStart = (item: Deal) => {
  draggingItem.value = item
}

const onDrop = (columnValue: string) => {
  if (draggingItem.value) {
    emit('move', draggingItem.value, columnValue)
    draggingItem.value = null
  }
}
</script>
