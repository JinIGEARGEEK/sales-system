<template>
  <div class="flex gap-2">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="h-8 rounded-[var(--ui-radius)] border px-3 text-sm cursor-pointer transition-colors"
      :class="modelValue === option.value
        ? 'border-(--color-primary) bg-(--color-primary-bg) text-(--color-primary)'
        : 'border-(--color-light-gray-2) bg-white text-(--color-black) hover:bg-(--color-light-gray-1)'"
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
