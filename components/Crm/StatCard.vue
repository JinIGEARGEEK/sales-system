<template>
  <UCard class="ring-[var(--color-card-border)]">
    <p class="text-sm text-[var(--color-gray)]">{{ label }}</p>
    <p class="mt-1 text-2xl font-medium" :class="valueClass">
      <slot />
    </p>
    <p v-if="$slots.hint" class="mt-1 text-xs" :class="hintClass">
      <slot name="hint" />
    </p>
  </UCard>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
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
