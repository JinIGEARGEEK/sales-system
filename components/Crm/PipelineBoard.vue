<template>
  <div class="flex items-stretch gap-4 overflow-x-auto pb-2">
    <div
      v-for="column in columns"
      :key="column.value"
      class="flex w-64 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--color-card-border)]"
      @dragover.prevent
      @drop="onDrop(column.value)"
    >
      <div
        class="flex items-center justify-between px-3 py-2"
        :style="{ backgroundColor: getColumnColor(column.value) }"
      >
        <span class="text-sm font-medium text-white">{{ column.label }}</span>
        <span class="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium text-white">
          {{ grouped[column.value]?.length || 0 }}
        </span>
      </div>

      <div
        class="flex flex-1 flex-col gap-2 p-3"
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

const getColumnColor = (value: string) => DEAL_STAGE_COLORS[value as DealStage] || FALLBACK_COLOR

const getColumnTint = (value: string) => `color-mix(in srgb, ${getColumnColor(value)} 8%, white)`

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
