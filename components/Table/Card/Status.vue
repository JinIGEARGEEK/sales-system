<template>
  <div>
    <div
      v-if="props.items.isNoData"
      class="static-body-xs text-[var(--color-dark-gray)]"
    >
      -
    </div>
    <UBadge v-else :color="props.items.color || 'neutral'" variant="subtle" size="sm">
      {{ props.items.title }}
    </UBadge>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  items: {
    type: Object,
    default: () => ({}),
  },
})
</script>
