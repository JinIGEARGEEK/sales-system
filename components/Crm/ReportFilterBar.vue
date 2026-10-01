<template>
  <!-- The filter panel every Reports page shares: the glass card, the
  wrapping input row and a built-in Clear button. Inputs go in the default
  slot; the page keeps its own filter refs and passes `show-clear` (any
  filter active) and handles `@clear`. Below `sm` the inputs stack full
  width and Clear is a labelled full-width button; from `sm` up it's an
  icon-only square aligned to the inputs' bottom edge (items-end — no
  invisible-label spacer needed). -->
  <UCard class="mb-4" :ui="GLASS_PANEL_UI" data-cy="report-filter-bar">
    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <slot />
      <template v-if="showClear">
        <UButton
          icon="material-symbols:filter-alt-off-outline"
          variant="outline"
          color="neutral"
          size="xs"
          block
          class="sm:hidden"
          :label="clearLabel"
          data-cy="report-filter-clear-mobile"
          @click="emit('clear')"
        />
        <UTooltip :text="clearLabel">
          <UButton
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            size="xs"
            square
            class="hidden sm:inline-flex"
            :aria-label="clearLabel"
            data-cy="report-filter-clear"
            @click="emit('clear')"
          />
        </UTooltip>
      </template>
      <!-- After Clear, e.g. a right-aligned (ml-auto) total. -->
      <slot name="trailing" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { GLASS_PANEL_UI } from '~/constants/ui'

defineProps<{
  // Show the Clear button — bind to the page's "any filter is active".
  showClear: boolean
  // Accessible name / tooltip / mobile label for the Clear button.
  clearLabel: string
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>
