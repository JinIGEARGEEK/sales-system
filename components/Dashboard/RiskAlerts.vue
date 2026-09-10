<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-(--color-light-gray-2) pb-2 text-sm font-semibold text-(--color-black)">
      {{ t('crm.dashboard.sectionRiskAlerts') }}
    </h3>

    <UCard :ui="{ body: 'p-0 divide-y divide-(--color-light-gray-2)' }">
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.path"
        class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-(--color-light-gray-1)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-warning-hover)/15">
            <UIcon :name="item.icon" class="size-4 text-(--color-warning-hover)" />
          </div>
          <span class="truncate text-sm font-medium">{{ item.title }}</span>
        </div>
        <USkeleton v-if="counts[item.key] === null" class="h-5 w-6 shrink-0 rounded-full" />
        <UBadge
          v-else
          class="shrink-0 font-semibold"
          :color="badgeColor(counts[item.key])"
          :variant="counts[item.key] ? 'solid' : 'subtle'"
          size="sm"
        >
          {{ counts[item.key] }}
        </UBadge>
      </NuxtLink>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  counts: Record<string, number | null>
}>()

// Derived from the shared ATTENTION_ITEMS catalog (stores/attentionCounts.ts)
// — same 5 metrics as pages/crm/reports/index.vue's own "Needs Attention"
// section, condensed into single rows here. A computed (not a plain array)
// so titles stay reactive to a live locale switch, and mapping over the
// shared catalog means this list can't drift out of sync with Reports'.
const items = computed(() => ATTENTION_ITEMS.map(item => ({
  key: item.key,
  path: item.path,
  icon: item.icon,
  title: t(`crm.reports.${item.key}.cardTitle`),
})))
</script>
