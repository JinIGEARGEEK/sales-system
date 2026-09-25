<template>
  <!-- Replaces the dashboard's former "Pipeline by Stage" bar chart, which
  duplicated the Overview Pipeline page — a compact pointer there instead.
  Only rendered for a role that can open that page (SALES_PIPELINE_ROLES). -->
  <NuxtLink
    to="/crm/overview-pipeline"
    class="mb-8 flex items-center gap-3 rounded-xl border border-(--color-card-border) bg-white px-4 py-3 transition-colors hover:bg-(--color-light-gray-1)"
    data-cy="dashboard-overview-pipeline-link"
  >
    <span class="grid size-9 shrink-0 place-items-center rounded-full bg-(--color-primary)/10 text-(--color-primary)">
      <UIcon name="material-symbols:view-kanban-outline" class="size-5" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-semibold text-(--color-black)">{{ t('crm.dashboard.overviewPipelineLinkTitle') }}</span>
      <span class="block text-xs text-(--color-gray)">{{ t('crm.dashboard.overviewPipelineLinkBody') }}</span>
    </span>
    <span class="hidden shrink-0 items-center gap-0.5 text-xs font-medium text-(--color-primary) sm:flex">
      {{ t('crm.dashboard.overviewPipelineLinkAction') }}
      <UIcon name="material-symbols:arrow-forward-rounded" class="size-3.5" />
    </span>
    <UIcon name="material-symbols:chevron-right" class="size-5 shrink-0 text-(--color-gray) sm:hidden" />
  </NuxtLink>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
