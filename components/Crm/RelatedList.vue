<template>
  <!-- One "related records" card on a detail page's tab (Company detail's
  Contacts, Deals, Quotes, Products, …): a title row with an optional Add
  button, then either the TableEmpty empty state or one row per item.
  Rows render through the `#row` slot, which gets the shared row classes as
  `rowClass` for its own NuxtLink/button. The default slot replaces the
  list for a tab that renders its own component (timeline, task list). -->
  <ContainerTemplate :data-cy="dataCy || undefined">
    <div class="mb-4 flex items-center justify-between gap-2">
      <CardTitle>{{ title }}</CardTitle>
      <ButtonPrimary v-if="addLabel" :label="addLabel" icon="material-symbols:add" small @click="emit('add')" />
    </div>
    <slot>
      <TableEmpty v-if="items.length === 0" :title="emptyTitle" :icon="emptyIcon" />
      <ul v-else class="flex flex-col gap-2">
        <li v-for="item in items" :key="itemKey(item)">
          <slot name="row" :item="item" :row-class="ROW_CLASS" />
        </li>
      </ul>
    </slot>
  </ContainerTemplate>
</template>

<script setup lang="ts" generic="T">
// Small list rows inside a card keep the light-gray-2 border (design-system
// §2.5.1: rows, not cards).
const ROW_CLASS = 'flex w-full items-center justify-between gap-3 rounded-lg border border-(--color-light-gray-2) px-4 py-3 text-left hover:bg-(--color-light-gray-1)'

withDefaults(defineProps<{
  title: string
  items?: T[]
  // The Add button shows only when this is set (pass undefined to hide it
  // for a role that can't add); clicking emits `add`.
  addLabel?: string
  emptyTitle?: string
  emptyIcon?: string
  // Defaults to the item's `id`; pass one for rows without it.
  itemKey?: (item: T) => number | string
  dataCy?: string
}>(), {
  items: () => [],
  addLabel: undefined,
  emptyTitle: undefined,
  emptyIcon: undefined,
  itemKey: (item: T) => (item as { id: number | string }).id,
  dataCy: undefined,
})

const emit = defineEmits<{
  add: []
}>()

defineSlots<{
  default?: () => unknown
  row?: (props: { item: T, rowClass: string }) => unknown
}>()
</script>
