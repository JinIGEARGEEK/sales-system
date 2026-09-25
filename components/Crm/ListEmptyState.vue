<template>
  <div class="flex flex-col items-center gap-3 px-4 py-10 text-center" data-cy="list-empty-state">
    <span class="grid size-12 place-items-center rounded-full bg-(--color-primary-bg) text-(--color-primary)">
      <UIcon :name="filtered ? 'material-symbols:search-off' : icon" class="size-6" />
    </span>
    <div>
      <p class="text-base font-semibold text-(--color-black)">{{ title }}</p>
      <p v-if="description" class="mt-1 text-sm text-(--color-gray)">{{ description }}</p>
    </div>
    <div class="flex flex-wrap justify-center gap-2">
      <ButtonPrimary
        v-if="filtered"
        outline
        icon="material-symbols:filter-alt-off-outline"
        :label="clearFiltersLabel"
        data-cy="list-empty-clear-filters"
        @click="emit('clear-filters')"
      />
      <ButtonPrimary
        v-else-if="actionLabel"
        icon="material-symbols:add"
        :label="actionLabel"
        data-cy="list-empty-action"
        @click="emit('action')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Empty state for a list that isn't a TableData (e.g. the grouped Tasks
// list): a "nothing here yet" state with an optional create CTA, or — when
// `filtered` — a "nothing matches" state offering to clear the filters.
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string
  actionLabel?: string
  clearFiltersLabel?: string
  filtered?: boolean
}>(), {
  description: '',
  icon: 'material-symbols:inbox-outline',
  actionLabel: '',
  clearFiltersLabel: '',
  filtered: false,
})

const emit = defineEmits<{
  'action': []
  'clear-filters': []
}>()
</script>
