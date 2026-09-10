<template>
  <div>
    <div
      v-if="props.items.isNoData"
      class="static-body-xs text-(--color-dark-gray)"
    >
      -
    </div>
    <!-- Compact icon-only variant (e.g. a "Primary" flag star) — set
    `items.icon` instead of `items.title` when a full text pill would be
    noisier than useful in a dense table column. -->
    <UIcon
      v-else-if="props.items.icon"
      :name="props.items.icon"
      class="size-4"
      :class="ICON_COLOR_CLASS[props.items.color as keyof typeof ICON_COLOR_CLASS] || ICON_COLOR_CLASS.neutral"
    />
    <UBadge v-else :color="props.items.color || 'neutral'" variant="subtle" size="sm">
      {{ props.items.title }}
    </UBadge>
  </div>
</template>

<script setup lang="ts">
// Mirrors the design-token colors already used for badges/toasts elsewhere
// (e.g. components/Dashboard/PipelineOverview.vue, useNotify.ts) rather than
// reaching for Nuxt UI's internal --ui-color-* palette variables, which
// nothing else in this codebase references directly.
const ICON_COLOR_CLASS = {
  primary: 'text-(--color-primary)',
  success: 'text-(--color-success-toast)',
  warning: 'text-(--color-warning-hover)',
  error: 'text-(--color-danger-toast)',
  info: 'text-(--color-info-toast)',
  neutral: 'text-(--color-gray)',
}

const props = defineProps({
  items: {
    type: Object,
    default: () => ({}),
  },
})
</script>
