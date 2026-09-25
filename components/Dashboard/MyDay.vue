<template>
  <div class="mb-8" data-cy="dashboard-my-day">
    <DashboardSectionHeader
      :title="t('crm.dashboard.sectionMyDay')"
      link-to="/crm/tasks"
      :link-text="t('crm.dashboard.myDayAllTasks')"
    />

    <div class="grid grid-cols-1 gap-4" :class="{ 'lg:grid-cols-2': showStaleDeals }">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/10">
              <UIcon name="material-symbols:today-outline" class="size-4 text-(--color-primary)" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.myTasks') }}</h3>
            <UBadge v-if="overdueTotal > 0" color="error" variant="subtle" :label="t('crm.dashboard.myOverdueCount', { count: overdueTotal })" />
            <UBadge color="primary" variant="subtle" :label="t('crm.dashboard.myTodayCount', { count: todayTotal })" />
          </div>
        </template>
        <div v-if="loading" class="flex flex-col gap-2">
          <USkeleton v-for="i in 3" :key="`my-task-skeleton-${i}`" class="h-12 w-full rounded-lg" />
        </div>
        <div v-else-if="tasks.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
          {{ t('crm.dashboard.myDayNoTasks') }}
        </div>
        <div v-else class="flex flex-col gap-2">
          <NuxtLink
            v-for="task in tasks"
            :key="task.id"
            :to="task.path || '/crm/tasks'"
            class="flex items-center justify-between gap-3 rounded-lg border border-(--color-light-gray-2) px-4 py-2.5 hover:bg-(--color-light-gray-1)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium" :title="task.title">{{ task.title }}</p>
              <p class="truncate text-xs text-(--color-gray)">{{ task.relatedLabel }}</p>
            </div>
            <UBadge :color="task.isOverdue ? 'error' : 'primary'" variant="subtle" class="shrink-0">
              {{ task.isOverdue ? dateFormat(task.due_date) : t('crm.dashboard.dueToday') }}
            </UBadge>
          </NuxtLink>
          <NuxtLink
            v-if="overdueTotal + todayTotal > tasks.length"
            to="/crm/tasks"
            class="text-center text-xs font-medium text-(--color-primary) hover:underline"
          >
            {{ t('crm.dashboard.myDayMoreTasks', { count: overdueTotal + todayTotal - tasks.length }) }}
          </NuxtLink>
        </div>
      </UCard>

      <UCard v-if="showStaleDeals" class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-warning-hover)/15">
              <UIcon name="material-symbols:schedule-outline" class="size-4 text-(--color-warning-hover)" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.myStaleDeals') }}</h3>
            <UBadge v-if="staleDeals.length > 0" color="warning" variant="subtle" :label="String(staleDeals.length)" />
          </div>
          <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.dashboard.myStaleDealsHint') }}</p>
        </template>
        <div v-if="loading" class="flex flex-col gap-2">
          <USkeleton v-for="i in 3" :key="`my-deal-skeleton-${i}`" class="h-12 w-full rounded-lg" />
        </div>
        <div v-else-if="staleDeals.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
          {{ t('crm.dashboard.myDayNoStaleDeals') }}
        </div>
        <div v-else class="flex max-h-72 flex-col gap-2 overflow-y-auto">
          <NuxtLink
            v-for="deal in staleDeals"
            :key="deal.id"
            :to="`/crm/deals/${deal.id}`"
            class="flex items-center justify-between gap-3 rounded-lg border border-(--color-light-gray-2) px-4 py-2.5 hover:bg-(--color-light-gray-1)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium" :title="deal.title">{{ deal.title }}</p>
              <p class="truncate text-xs text-(--color-gray)">{{ deal.stage }}</p>
            </div>
            <UBadge color="warning" variant="subtle" class="shrink-0">
              {{ t('crm.dashboard.daysInStage', { days: deal.days }) }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { dateFormat } = useFormatter()

defineProps<{
  // The signed-in user's pending tasks due today or earlier, most overdue first.
  tasks: { id: number, title: string, due_date: Date, isOverdue: boolean, relatedLabel: string, path: string }[]
  overdueTotal: number
  todayTotal: number
  // Open deals assigned to the user that have sat in their stage past that
  // stage's stale threshold (same rule as the Overview Pipeline's "Stale").
  staleDeals: { id: number, title: string, stage: string, days: number }[]
  showStaleDeals: boolean
  loading: boolean
}>()
</script>
