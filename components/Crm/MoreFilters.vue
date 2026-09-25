<template>
  <!-- List-page counterpart of the Dashboard filter bar's "More filters"
       collapse (components/Dashboard/FilterBar.vue): below md the wrapped
       secondary filters stay hidden behind a toggle so search + the primary
       filter fit the first mobile screen; md+ always shows them. Both the
       toggle and the wrapper use `display: contents`-style placement so the
       slotted filters sit directly in the caller's own flex/grid row. -->
  <div class="md:hidden">
    <UButton
      :label="expanded ? t('global.fewerFilters') : t('global.moreFilters')"
      :icon="expanded ? 'material-symbols:expand-less' : 'material-symbols:tune'"
      size="sm"
      variant="subtle"
      color="primary"
      class="font-medium"
      :aria-expanded="expanded"
      data-cy="more-filters-toggle"
      @click="expanded = !expanded"
    >
      <template v-if="count > 0" #trailing>
        <UBadge :label="count" size="xs" color="primary" variant="solid" />
      </template>
    </UButton>
  </div>
  <div :class="expanded ? 'contents' : 'hidden md:contents'">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

withDefaults(defineProps<{
  // How many of the slotted (collapsible) filters currently hold a non-default
  // value — shown as a badge on the toggle so an active hidden filter isn't
  // invisible while collapsed.
  count?: number
}>(), { count: 0 })

const expanded = ref(false)
</script>
