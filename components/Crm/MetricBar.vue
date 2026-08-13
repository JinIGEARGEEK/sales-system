<template>
  <div class="flex items-center gap-3">
    <span class="w-32 shrink-0 truncate text-sm">{{ label }}</span>
    <div class="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-light-gray-2)]">
      <div class="h-full rounded-full" :class="barClass" :style="`width: ${percent}%`" />
    </div>
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
    default: 'bg-sky-400',
  },
})
</script>
