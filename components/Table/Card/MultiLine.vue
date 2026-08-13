<template>
  <div>
    <div
      v-if="props.items.isNoData"
      class="static-body-xs text-[var(--color-dark-gray)]"
    >
      -
    </div>
    <div v-else>
      <div class="static-body-sm text-[var(--color-black)]">
        {{ props.items.title }}
      </div>
      <div class="static-body-xs text-[var(--color-dark-gray)]">
        {{ props.items.description }}
      </div>
    </div>
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
