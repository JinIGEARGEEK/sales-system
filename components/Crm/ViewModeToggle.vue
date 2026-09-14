<template>
  <!-- One joined segmented control, not two standalone buttons — kept
       visually distinct from whatever action buttons sit next to it so it
       doesn't read as a third/fourth action in the row. Shared by every
       Kanban/List page (Deals, Prospects) — previously copy-pasted between
       them; keep this the single place that markup lives. -->
  <div class="flex items-center gap-0.5 rounded-full bg-(--color-light-gray-1) p-1">
    <UTooltip :text="kanbanLabel">
      <button
        type="button"
        class="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors"
        :class="modelValue === 'kanban' ? 'bg-(--color-primary) text-white shadow-sm' : 'text-(--color-gray) hover:text-(--color-black)'"
        :aria-label="kanbanLabel"
        @click="emit('update:modelValue', 'kanban')"
      >
        <UIcon name="material-symbols:view-kanban-outline" class="size-4" />
      </button>
    </UTooltip>
    <UTooltip :text="listLabel">
      <button
        type="button"
        class="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors"
        :class="modelValue === 'list' ? 'bg-(--color-primary) text-white shadow-sm' : 'text-(--color-gray) hover:text-(--color-black)'"
        :aria-label="listLabel"
        @click="emit('update:modelValue', 'list')"
      >
        <UIcon name="material-symbols:view-list" class="size-4" />
      </button>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: 'kanban' | 'list'
  kanbanLabel: string
  listLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: 'kanban' | 'list']
}>()
</script>
