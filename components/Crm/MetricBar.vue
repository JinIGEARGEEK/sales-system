<template>
  <div class="flex items-center gap-3">
    <span class="w-32 shrink-0 truncate text-sm">{{ label }}</span>
    <UTooltip :text="tooltip || `${label} — ${percent}%`">
      <div class="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-light-gray-2)]">
        <div
          class="h-full rounded-full transition-[filter] duration-150 hover:brightness-110"
          :class="barClass"
          :style="`width: ${percent}%`"
        />
      </div>
    </UTooltip>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
  percent: {
    type: Number,
    required: true,
  },
  barClass: {
    type: String,
    // See biz_spec/design-system.md §2.6 — deliberately not --color-primary
    // (dark navy reads poorly as a progress-bar fill against a light track).
    default: 'bg-sky-400',
  },
  // Optional hover-tooltip text; falls back to "label — percent%" so every
  // bar gets a hover affordance even where the caller doesn't pass one.
  tooltip: {
    type: String,
    default: '',
  },
})
</script>
