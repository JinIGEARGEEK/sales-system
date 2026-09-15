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
    noisier than useful in a dense table column. `items.title` still carries
    the accessible name (screen-reader-only) so removing the visible text
    pill doesn't also remove what a screen reader announces for this cell. -->
    <span v-else-if="props.items.icon" class="inline-flex">
      <UIcon
        :name="props.items.icon"
        class="size-4"
        :class="ICON_COLOR_CLASS[props.items.color as keyof typeof ICON_COLOR_CLASS] || ICON_COLOR_CLASS.neutral"
        aria-hidden="true"
      />
      <span v-if="props.items.title" class="sr-only">{{ props.items.title }}</span>
    </span>
    <div v-else class="flex flex-col items-start gap-1">
      <UBadge :color="props.items.color || 'neutral'" variant="subtle" size="sm">
        {{ props.items.title }}
      </UBadge>
      <!-- Optional second line for a related record's own live status (e.g. a
      converted Lead's linked Deal outcome) — kept visually subordinate to the
      badge above it so it reads as context, not a second status of its own. -->
      <span
        v-if="props.items.caption"
        class="static-body-xs"
        :class="CAPTION_COLOR_CLASS[props.items.captionColor as keyof typeof CAPTION_COLOR_CLASS] || CAPTION_COLOR_CLASS.neutral"
      >
        {{ props.items.caption }}
      </span>
    </div>
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

// Same palette as the icon variant above, just a darker neutral — a caption
// is body text sitting on a light card background, where the icon's lighter
// gray reads as too faint.
const CAPTION_COLOR_CLASS = { ...ICON_COLOR_CLASS, neutral: 'text-(--color-dark-gray)' }

const props = defineProps({
  items: {
    type: Object,
    default: () => ({}),
  },
})
</script>
