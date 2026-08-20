<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
    <div class="relative flex size-32 shrink-0 items-center justify-center rounded-full" :style="{ background: conicGradient }">
      <div class="absolute inset-[16%] flex flex-col items-center justify-center rounded-full bg-white text-center">
        <span class="text-base font-semibold">{{ totalLabel }}</span>
        <span v-if="totalSubLabel" class="text-[10px] text-[var(--color-gray)]">{{ totalSubLabel }}</span>
      </div>
    </div>

    <!-- Legend doubles as the direct-label + accessible table-view stand-in — a
    donut's own slices can't fit a label once a segment gets thin, so every
    value lives here instead of on the ring itself (dataviz skill's "label
    selectively, never a number on every point" + "legend always present for
    2+ series"). Status is carried by an icon + label, not color alone. -->
    <div class="flex flex-col gap-2">
      <UTooltip v-for="seg in segmentsWithPercent" :key="seg.label" :text="`${seg.label}: ${seg.valueLabel} (${seg.percent}%)`">
        <div class="flex items-center gap-2 text-sm">
          <UIcon v-if="seg.icon" :name="seg.icon" class="size-3.5 shrink-0" :style="{ color: seg.colorVar }" />
          <span v-else class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: seg.colorVar }" />
          <span class="min-w-20 text-[var(--color-black)]">{{ seg.label }}</span>
          <span class="font-medium text-[var(--color-black)]">{{ seg.valueLabel }}</span>
          <span class="text-xs text-[var(--color-gray)]">({{ seg.percent }}%)</span>
        </div>
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
// Generic donut: percent-of-whole segments rendered as a CSS conic-gradient
// ring (no chart library in this codebase — every existing chart here is
// hand-rolled Tailwind/CSS, e.g. CrmMetricBar/the bar charts on
// pages/index.vue). A stacked horizontal bar is the dataviz-guideline default
// for part-to-whole, but a donut was the explicit ask here and reads fine at
// exactly 3 segments — this component doesn't scale past that without
// revisiting the choice (5+ thin slices is exactly where a donut stops working).
const props = defineProps<{
  // valueLabel is caller-formatted (e.g. currency-compact via priceFormatCompact)
  // rather than derived here — segment values are often money, and this
  // component has no formatting opinion of its own. Falls back to a plain
  // toLocaleString() when omitted (e.g. a segment counted in plain units).
  segments: { label: string, value: number, colorVar: string, icon?: string, valueLabel?: string }[]
  // Center-of-ring value, e.g. a currency-formatted total. Falls back to the
  // sum of segment values if omitted.
  totalLabel?: string
  totalSubLabel?: string
}>()

const total = computed(() => props.segments.reduce((sum, seg) => sum + seg.value, 0))

const totalLabel = computed(() => props.totalLabel ?? String(total.value))

// A 1.5deg gap between segments — the conic-gradient equivalent of the
// skill's "2px surface gap separates touching marks" spacer, since a
// conic-gradient has no native stroke/gap primitive to draw a true border
// between arcs.
const GAP_DEGREES = 1.5

const segmentsWithPercent = computed(() => props.segments.map(seg => ({
  ...seg,
  percent: total.value > 0 ? Math.round((seg.value / total.value) * 100) : 0,
  valueLabel: seg.valueLabel ?? seg.value.toLocaleString(),
})))

const conicGradient = computed(() => {
  if (total.value <= 0) return 'var(--color-light-gray-2)'
  let angle = 0
  const stops: string[] = []
  for (const seg of props.segments) {
    const sweep = (seg.value / total.value) * 360
    if (sweep <= 0) continue
    const start = angle
    const end = angle + Math.max(sweep - GAP_DEGREES, 0)
    stops.push(`${seg.colorVar} ${start}deg ${end}deg`)
    angle += sweep
  }
  return `conic-gradient(${stops.join(', ')})`
})
</script>
