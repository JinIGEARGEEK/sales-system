<template>
  <div class="flex flex-col items-center gap-1.5 px-2">
    <template v-for="(stage, index) in stages" :key="stage.label">
      <UTooltip :text="tooltipFor(stage, index)">
        <div
          class="flex h-9 items-center justify-center rounded-md text-xs font-medium text-white transition-[filter] duration-150 hover:brightness-110"
          :class="stage.value > 0 ? (stage.barClass || 'bg-sky-400') : 'bg-[var(--color-light-gray-2)] text-[var(--color-gray)]'"
          :style="{ width: `${widthPercent(stage.value)}%`, minWidth: '3.5rem' }"
        >
          {{ stage.value }}
        </div>
      </UTooltip>
      <span class="text-[11px] text-[var(--color-gray)]">
        {{ stage.label }}
        <template v-if="index > 0 && (stages[0]?.value ?? 0) > 0">· {{ conversionFromFirst(stage) }}%</template>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
// Deal-count-per-stage funnel: each bar's width is relative to the largest
// stage (normally the first, but scaled off the actual max so an unusual
// distribution — e.g. more deals mid-pipeline than at Lead — never produces
// a bar wider than its container). Centered (not left-aligned, unlike
// CrmMetricBar) so consecutive shrinking bars read as a funnel taper.
const props = defineProps<{
  stages: { label: string, value: number, barClass?: string }[]
}>()

const maxValue = computed(() => Math.max(...props.stages.map(s => s.value), 1))
const widthPercent = (value: number) => Math.max(Math.round((value / maxValue.value) * 100), value > 0 ? 14 : 8)

const conversionFromFirst = (stage: { value: number }) => {
  const first = props.stages[0]?.value || 0
  if (first === 0) return 0
  return Math.round((stage.value / first) * 100)
}

const tooltipFor = (stage: { label: string, value: number }, index: number) => {
  if (index === 0) return `${stage.label}: ${stage.value}`
  return `${stage.label}: ${stage.value} (${conversionFromFirst(stage)}% of ${props.stages[0]?.label})`
}
</script>
