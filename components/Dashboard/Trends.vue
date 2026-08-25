<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
      {{ t('crm.dashboard.sectionTrends') }}
    </h3>

    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-info-toast)]/15">
              <UIcon name="material-symbols:show-chart" class="size-4 text-[var(--color-info-toast)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.revenueTrend') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.revenueTrendHint') }}</p>
        </template>
        <div class="relative flex h-40 items-end gap-4 px-2">
          <div class="pointer-events-none absolute inset-x-2 top-0 flex h-28 flex-col justify-between">
            <div v-for="line in 4" :key="line" class="border-t border-dashed border-[var(--color-light-gray-2)]" />
          </div>
          <div v-for="bucket in revenueTrend" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
            <span class="text-xs font-medium" :class="bucket.value > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
              {{ t('global.currencySymbol') }}{{ priceFormatCompact(bucket.value) }}
            </span>
            <UTooltip :text="`${bucket.label}: ${t('global.currencySymbol')}${priceFormatCompact(bucket.value)}`">
              <div class="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
                <div
                  class="w-full rounded-t-md transition-[filter] duration-150 hover:brightness-110"
                  :class="bucket.value > 0 ? 'bg-sky-400' : 'bg-[var(--color-gray)]/40'"
                  :style="`height: ${Math.max(bucket.percent, 4)}%`"
                />
              </div>
            </UTooltip>
            <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
          </div>
        </div>
      </UCard>

      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-chart-violet)]/15">
              <UIcon name="material-symbols:trending-up" class="size-4 text-[var(--color-chart-violet)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.forecastTrend') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.forecastTrendHint') }}</p>
        </template>
        <div class="relative flex h-40 items-end gap-4 px-2">
          <div class="pointer-events-none absolute inset-x-2 top-0 flex h-28 flex-col justify-between">
            <div v-for="line in 4" :key="line" class="border-t border-dashed border-[var(--color-light-gray-2)]" />
          </div>
          <div v-for="bucket in forecastTrend" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
            <span class="text-xs font-medium" :class="bucket.value > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
              {{ t('global.currencySymbol') }}{{ priceFormatCompact(bucket.value) }}
            </span>
            <UTooltip :text="`${bucket.label}: ${t('global.currencySymbol')}${priceFormatCompact(bucket.value)}`">
              <div class="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
                <div
                  class="w-full rounded-t-md transition-[filter] duration-150 hover:brightness-110"
                  :class="bucket.value > 0 ? 'bg-violet-400' : 'bg-[var(--color-gray)]/40'"
                  :style="`height: ${Math.max(bucket.percent, 4)}%`"
                />
              </div>
            </UTooltip>
            <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="ring-[var(--color-card-border)]">
      <template #header>
        <div class="flex items-center gap-2">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-toast)]/15">
            <UIcon name="material-symbols:flag-outline" class="size-4 text-[var(--color-success-toast)]" />
          </div>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.annualRevenueTrend') }}</h3>
        </div>
        <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.annualRevenueTrendHint') }}</p>
      </template>
      <div class="relative flex h-40 items-end gap-3 px-2">
        <div class="pointer-events-none absolute inset-x-2 top-0 flex h-28 flex-col justify-between">
          <div v-for="line in 4" :key="line" class="border-t border-dashed border-[var(--color-light-gray-2)]" />
        </div>
        <div v-for="bucket in annualRevenueTrendChart" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
          <span class="text-xs font-medium" :class="bucket.actual > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
            {{ t('global.currencySymbol') }}{{ priceFormatCompact(bucket.actual) }}
          </span>
          <UTooltip :text="`${bucket.label}: ${t('global.currencySymbol')}${priceFormatCompact(bucket.actual)} (${t('crm.dashboard.annualRevenueTrendPaceLabel', { pace: `${t('global.currencySymbol')}${priceFormatCompact(bucket.goal_pace)}` })})`">
            <div class="relative flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
              <div
                class="w-full rounded-t-md transition-[filter] duration-150 hover:brightness-110"
                :class="bucket.actual >= bucket.goal_pace ? 'bg-[var(--color-success-toast)]' : 'bg-[var(--color-danger-toast)]'"
                :style="`height: ${Math.max(bucket.actualPercent, 4)}%`"
              />
              <div
                class="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-[var(--color-black)]/40"
                :style="`bottom: ${bucket.goalPacePercent}%`"
              />
            </div>
          </UTooltip>
          <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormatCompact } = useFormatter()

defineProps<{
  revenueTrend: { label: string, value: number, percent: number }[]
  forecastTrend: { label: string, value: number, percent: number }[]
  annualRevenueTrendChart: { label: string, actual: number, goal_pace: number, actualPercent: number, goalPacePercent: number }[]
}>()
</script>
