<template>
  <div>
    <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
      {{ t('crm.dashboard.sectionFollowUpsTeam') }}
    </h3>

    <div class="mb-6">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-hover)]/15">
              <UIcon name="material-symbols:event-upcoming-outline" class="size-4 text-[var(--color-warning-hover)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.upcomingFollowUps') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.upcomingFollowUpsHint') }}</p>
        </template>
        <div v-if="upcomingTasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noUpcomingTasks') }}
        </div>
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <NuxtLink
            v-for="task in upcomingTasks"
            :key="task.id"
            :to="task.path"
            class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ task.title }}</p>
              <p class="truncate text-xs text-[var(--color-gray)]">{{ task.relatedLabel }} · {{ task.assignedToName }}</p>
            </div>
            <UBadge :color="task.isOverdue ? 'error' : 'neutral'" variant="subtle" class="shrink-0">
              {{ dateFormat(task.due_date) }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <div v-if="canViewSalesPipelineWidgets" class="mb-6">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-toast)]/15">
              <UIcon name="material-symbols:notifications-outline" class="size-4 text-[var(--color-danger-toast)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.recentAlerts') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.recentAlertsHint') }}</p>
        </template>
        <div v-if="recentAlerts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noRecentAlerts') }}
        </div>
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <NuxtLink
            v-for="alert in recentAlerts"
            :key="alert.id"
            :to="`/crm/deals/${alert.deal_id}`"
            class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ alert.deal_title }}</p>
              <p class="truncate text-xs text-[var(--color-gray)]">{{ alert.rule_name }}</p>
            </div>
            <UBadge color="neutral" variant="subtle" class="shrink-0">
              {{ dateTimeFormat(alert.notified_at.toISOString()) }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <div v-if="canViewSalesPipelineWidgets" class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-toast)]/15">
                <UIcon name="material-symbols:leaderboard-outline" class="size-4 text-[var(--color-success-toast)]" />
              </div>
              <h3 class="text-lg font-medium">{{ t('crm.dashboard.winRateByIndustry') }}</h3>
            </div>
            <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.winRateByIndustryHint') }}</p>
          </template>
          <div v-if="industryBreakdown.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.dashboard.noClosedDeals') }}
          </div>
          <div v-else class="flex flex-col gap-3">
            <CrmMetricBar
              v-for="row in industryBreakdown"
              :key="row.industry"
              :label="row.industry"
              :percent="row.winRate"
              :bar-class="row.barClass"
              :tooltip="`${row.industry}: ${row.winRate}% · ${t('crm.dashboard.dealsWon', { count: row.wonCount })}`"
            >
              <span class="min-w-14 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.winRate }}%</span>
              <span class="min-w-16 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.dealsWon', { count: row.wonCount }) }}</span>
            </CrmMetricBar>
          </div>
        </UCard>
      </div>

      <div class="lg:col-span-2">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-info-toast)]/15">
                <UIcon name="material-symbols:groups-outline" class="size-4 text-[var(--color-info-toast)]" />
              </div>
              <h3 class="text-lg font-medium">{{ t('crm.dashboard.teamPerformance') }}</h3>
            </div>
            <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.teamPerformanceHint') }}</p>
          </template>
          <div class="flex flex-col gap-2">
            <div
              v-for="member in teamPerformance"
              :key="member.id"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <UAvatar :text="member.initials" size="sm" />
                <div>
                  <p class="text-sm font-medium">{{ member.name }}</p>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.dealsWon', { count: member.wonCount }) }} · {{ member.winRate }}%</p>
                </div>
              </div>
              <span class="text-sm font-medium">{{ t('global.currencySymbol') }}{{ priceFormatCompact(member.wonValue) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormatCompact, dateFormat, dateTimeFormat } = useFormatter()

defineProps<{
  upcomingTasks: {
    id: number
    title: string
    due_date: Date
    isOverdue: boolean
    relatedLabel: string
    path: string
    assignedToName: string
  }[]
  canViewSalesPipelineWidgets: boolean
  recentAlerts: { id: number, deal_id: number, deal_title: string, rule_name: string, notified_at: Date }[]
  industryBreakdown: { industry: string, wonCount: number, winRate: number, barClass: string }[]
  teamPerformance: { id: number, name: string, initials: string, wonCount: number, wonValue: number, winRate: number }[]
}>()
</script>
