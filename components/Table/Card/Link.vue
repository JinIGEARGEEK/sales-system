<template>
  <div>
    <NuxtLink :to="props.items.path">
      <div class="static-link-sm text-primary">
        {{ props.items.label }}
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  items: {
    type: Object as PropType<TableTypeLink>,
    default: () => ({}),
  },
})
</script>
