<template>
  <UTooltip v-if="hasRole('Admin')" :text="tooltip">
    <UButton
      icon="material-symbols:settings-outline"
      :label="$t('global.goToStageSetting')"
      variant="ghost"
      color="neutral"
      size="sm"
      :aria-label="tooltip"
      :data-cy="`manage-${tab}-shortcut`"
      @click="navigateTo(`/admin/pipeline-config?tab=${tab}`)"
    />
  </UTooltip>
</template>

<script setup lang="ts">
// Admin-only gear-icon shortcut to /admin/pipeline-config's given tab — used
// on list pages whose Kanban/table is backed by that tab's config (Deals →
// 'stages', Prospects → 'prospects'). Single source for what was previously
// a verbatim-duplicated UTooltip+UButton block across those pages, so a
// future tweak (icon, data-cy shape, sizing) only needs to change here.
// Gated the same way as the destination page itself: pipeline-config.vue's
// own usePageAccess('Admin') reads the same effectiveRole getter this
// hasRole('Admin') call does, so the two can't drift out of sync.
defineProps<{
  // Matches one of pipeline-config.vue's TAB_VALUES — not typed against that
  // list directly to avoid a page->component import; an unrecognized value
  // just lands on pipeline-config.vue's own 'stages' fallback.
  tab: string
  tooltip: string
}>()

const { hasRole } = useRole()
</script>
