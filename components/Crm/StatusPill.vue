<template>
  <div class="flex gap-2">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="h-8 rounded-[var(--ui-radius)] border px-3 text-sm cursor-pointer transition-colors"
      :class="modelValue === option.value
        ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] text-[var(--color-primary)]'
        : 'border-[var(--color-light-gray-2)] bg-white text-[var(--color-black)] hover:bg-[var(--color-light-gray-1)]'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  options: Select[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
