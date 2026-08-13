<template>
  <div>
    <div v-if="items.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.components.activityTimeline.noActivity') }}
    </div>
    <div v-else class="flex flex-col gap-4">
      <div v-for="item in sortedItems" :key="item.id" class="flex gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-bg)]">
          <UIcon :name="iconFor(item.type)" class="size-4 text-[var(--color-primary)]" />
        </div>
        <div class="min-w-0 flex-1 border-b border-[var(--color-light-gray-2)] pb-3 last:border-none">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium">{{ item.subject }}</p>
            <span class="shrink-0 text-xs text-[var(--color-gray)]">{{ dateTimeFormat(item.created_at.toISOString()) }}</span>
          </div>
          <p v-if="item.notes" class="mt-1 text-xs text-[var(--color-gray)]">{{ item.notes }}</p>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.components.activityTimeline.by') }} {{ item.created_by }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  items: Activity[]
}>()

const { t } = useI18n()
const { dateTimeFormat } = useFormatter()

const sortedItems = computed(() =>
  [...props.items].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
)

const iconFor = (type: ActivityType) => {
  switch (type) {
    case 'call':
      return 'material-symbols:call-outline'
    case 'email':
      return 'material-symbols:mail-outline'
    case 'meeting':
      return 'material-symbols:groups-outline'
  }
}
</script>
