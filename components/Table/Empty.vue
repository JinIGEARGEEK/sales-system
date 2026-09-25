<template>
  <div
    class="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center"
    :data-cy="`table-empty${dataCySuffix}`"
    :data-empty-variant="filtered ? 'filtered' : 'empty'"
  >
    <div class="flex size-12 items-center justify-center rounded-full bg-(--color-light-gray-1)">
      <UIcon :name="iconName" class="size-6 text-(--color-gray)" aria-hidden="true" />
    </div>
    <p class="text-sm font-medium text-(--color-black)">{{ titleText }}</p>
    <p v-if="descriptionText" class="max-w-sm text-xs text-(--color-gray)">{{ descriptionText }}</p>

    <ButtonPrimary
      v-if="button"
      class="mt-2"
      :label="button.label"
      :icon="button.icon"
      :to="button.to"
      :outline="filtered"
      small
      fit-content
      :loading-auto="false"
      :data-cy="`table-empty-action${dataCySuffix}`"
      @click="button.onClick"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

// The empty state TableData renders (on both its desktop table and mobile
// card layouts) when there are no rows — see TableData's `empty*` /
// `filtered` props for what each one means.
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string
  actionLabel?: string
  actionTo?: RouteLocationRaw
  // Filters/search are active: "nothing matches" copy plus a Clear filters
  // button instead of the "nothing here yet" copy and create CTA.
  filtered?: boolean
  // Appended to the data-cy hooks ("table-empty", "table-empty-action") —
  // TableData passes '-mobile' for its mobile-layout copy.
  dataCySuffix?: string
}>(), {
  title: undefined,
  description: undefined,
  icon: undefined,
  actionLabel: undefined,
  actionTo: undefined,
  filtered: false,
  dataCySuffix: '',
})

const emit = defineEmits<{
  action: []
  clearFilters: []
}>()

const { t } = useI18n()

const iconName = computed(() => (props.filtered
  ? 'material-symbols:search-off'
  : props.icon || 'material-symbols:inbox-outline'))

const titleText = computed(() => (props.filtered
  ? t('global.table.empty.filteredTitle')
  : props.title || t('global.noData')))

// Clear filters when filtered, else the create CTA (a link when `actionTo`
// is set, otherwise it emits `action`).
const button = computed(() => {
  if (props.filtered) {
    return { label: t('global.table.empty.clearFilters'), icon: 'material-symbols:filter-alt-off-outline', to: undefined, onClick: () => emit('clearFilters') }
  }
  if (!props.actionLabel) return null
  return {
    label: props.actionLabel,
    icon: 'material-symbols:add',
    to: props.actionTo,
    onClick: () => { if (!props.actionTo) emit('action') },
  }
})

const descriptionText = computed(() => (props.filtered
  ? t('global.table.empty.filteredDescription')
  : props.description))
</script>
