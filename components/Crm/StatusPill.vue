<template>
  <!-- One scrollable row on narrow screens: labels never wrap ("All Status"
  used to break onto two lines inside its pill on mobile); the group scrolls
  sideways instead, with the scrollbar chrome hidden like other tab strips. -->
  <div class="flex min-w-0 max-w-full gap-2 overflow-x-auto scrollbar-hide">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-(--ui-radius) border px-3 text-sm cursor-pointer transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--color-primary)"
      :class="isActive(option)
        ? 'border-(--color-primary) bg-(--color-primary-bg) text-(--color-primary)'
        : 'border-(--color-light-gray-2) bg-white text-(--color-black) hover:bg-(--color-light-gray-1)'"
      :aria-pressed="isActive(option)"
      @click="emit('update:modelValue', String(option.value))"
    >
      <!-- Optional per-option content (e.g. an icon or count badge); defaults
      to the plain label. -->
      <slot name="option" :option="option" :active="isActive(option)">
        {{ option.label }}
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends Select">
const props = defineProps<{
  modelValue: string
  options: T[]
}>()

// Option values may be numbers; the model is always a string.
const isActive = (option: T) => props.modelValue === String(option.value)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
