<template>
  <component :is="linkTag" :to="linkTo" :class="to ? 'block transition-shadow hover:shadow-md' : ''">
    <UCard class="relative overflow-hidden ring-[var(--color-card-border)]" :ui="{ body: 'p-3' }">
      <div
        v-if="accentGlassClass"
        class="absolute inset-y-0 left-0 w-[10%] backdrop-blur-md"
        :class="accentGlassClass"
      />
      <div class="relative flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-1">
            <p class="truncate text-xs font-medium text-[var(--color-dark-gray)]" :title="label">{{ label }}</p>
            <UTooltip v-if="tooltip" :text="tooltip">
              <UIcon name="material-symbols:info-outline" class="size-3 shrink-0 text-[var(--color-gray)]" />
            </UTooltip>
          </div>
          <p class="mt-0.5 text-xl font-medium" :class="valueClass">
            <slot />
          </p>
          <!-- `reserveHintSpace` (opt-in, not global): reserves this line's
          height even when THIS card has no hint, so it doesn't sit shorter
          than a hint-bearing sibling in the same grid row. Only worth
          turning on for a grid that actually mixes hint and non-hint cards
          (e.g. PipelineOverview's) — every other caller has zero hint cards
          at all, so unconditionally reserving the space there would just add
          dead space to every card for no layout benefit. -->
          <p
            v-if="$slots.hint || reserveHintSpace"
            class="mt-0.5 text-[11px] leading-tight"
            :class="[hintClass, { 'min-h-3.5': reserveHintSpace }]"
          >
            <slot name="hint" />
          </p>
        </div>
        <div v-if="icon" class="flex size-8 shrink-0 items-center justify-center rounded-full" :class="iconBgClass">
          <UIcon :name="icon" class="size-4" :class="iconClass || valueClass" />
        </div>
      </div>
    </UCard>
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  // Optional Material Symbols icon, shown as a colored chip — pairs a
  // color-only health signal (valueClass) with a shape, not just a hue.
  icon: {
    type: String,
    default: '',
  },
  // Icon color; falls back to valueClass so the two dynamic health cards
  // (Win Rate, Pipeline Coverage) can keep driving both from one prop.
  iconClass: {
    type: String,
    default: '',
  },
  // Chip background tint — a light `/15` opacity wash of the icon's hue,
  // matching the pattern already used for status-colored backgrounds.
  iconBgClass: {
    type: String,
    default: 'bg-[var(--color-light-gray-1)]',
  },
  // A frosted-glass gradient panel covering the card's left ~10% width,
  // e.g. 'bg-gradient-to-r from-[var(--color-accent-green)]/40 to-transparent'.
  // UCard's own `overflow-hidden` clips it to the card's rounded corners.
  accentGlassClass: {
    type: String,
    default: '',
  },
  valueClass: {
    type: String,
    default: '',
  },
  hintClass: {
    type: String,
    default: 'text-[var(--color-gray)]',
  },
  // Explains how the value is calculated (e.g. "Sum of open deal value ×
  // win probability.") — shown via an info icon next to the label rather
  // than inline, so it doesn't compete with the always-visible hint slot
  // above (used for a dynamic on-track/below-target readout, not the
  // static calculation description).
  tooltip: {
    type: String,
    default: '',
  },
  // Optional deep-link target — when set, the whole card becomes a NuxtLink
  // into the filtered list view this stat summarizes, with a hover
  // affordance; omit to keep the card inert, same as before this prop
  // existed. Mirrors CrmMetricBar's own `to` prop; see useOptionalLink.
  to: {
    type: String,
    default: '',
  },
  // Set on every card in a grid where at least one sibling uses the `hint`
  // slot and at least one doesn't — reserves the hint line's height on
  // every card so hint-less ones don't sit shorter than their hint-bearing
  // siblings. Leave false (default) for a grid where no card ever has a
  // hint, so those stay compact instead of gaining unused blank space.
  reserveHintSpace: {
    type: Boolean,
    default: false,
  },
})

const { linkTag, linkTo } = useOptionalLink(toRef(props, 'to'))
</script>
