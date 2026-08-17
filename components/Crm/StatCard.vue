<template>
  <UCard class="relative overflow-hidden ring-[var(--color-card-border)]">
    <div
      v-if="accentGlassClass"
      class="absolute inset-y-0 left-0 w-[10%] backdrop-blur-md"
      :class="accentGlassClass"
    />
    <div class="relative flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-[var(--color-dark-gray)]">{{ label }}</p>
        <p class="mt-1 text-2xl font-medium" :class="valueClass">
          <slot />
        </p>
        <p v-if="$slots.hint" class="mt-1 text-xs" :class="hintClass">
          <slot name="hint" />
        </p>
      </div>
      <div v-if="icon" class="flex size-9 shrink-0 items-center justify-center rounded-full" :class="iconBgClass">
        <UIcon :name="icon" class="size-5" :class="iconClass || valueClass" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps({
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
})
</script>
