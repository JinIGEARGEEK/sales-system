<template>
  <ContainerTemplate>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold">{{ t('crm.deals.detail.activityTitle') }}</h3>
      <ButtonPrimary
        :label="t('crm.deals.detail.addActivity')"
        icon="material-symbols:add"
        small
        @click="openAddActivity"
      />
    </div>
    <CrmActivityTimeline :items="dealActivity" />

    <div v-if="stageHistory.length > 0" class="mt-6">
      <h3 class="mb-4 text-base font-semibold">{{ t('crm.deals.detail.stageHistoryTitle') }}</h3>
      <div class="flex flex-col gap-3">
        <div v-for="entry in stageHistory" :key="entry.id" class="flex gap-3 border-b border-(--color-light-gray-2) pb-3 last:border-none">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-light-gray-1)">
            <UIcon name="material-symbols:swap-horiz" class="size-4 text-(--color-gray)" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <UBadge v-if="entry.fromStage" color="neutral" variant="subtle" size="sm">{{ entry.fromStage }}</UBadge>
                <UIcon name="material-symbols:arrow-forward" class="size-3 shrink-0 text-(--color-gray)" />
                <UBadge color="neutral" variant="subtle" size="sm">{{ entry.toStage }}</UBadge>
              </div>
              <span class="shrink-0 text-xs text-(--color-gray)">{{ dateTimeFormat(entry.created_at.toISOString()) }}</span>
            </div>
            <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.deals.detail.stageHistoryBy', { actor: entry.actorName }) }}</p>
          </div>
        </div>
      </div>
    </div>

    <CrmAddActivityModal
      v-model:open="addActivityOpen"
      @submit="onSubmitActivity"
    />
  </ContainerTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { dateTimeFormat } = useFormatter()

const route = useRoute()
const { notifyApiError } = useApiErrorNotifier()
const activitiesStore = useActivitiesStore()
const { fetchDealStageHistory } = useDealStageHistory()

const dealId = Number(route.params.id)
const dealActivity = computed(() => activitiesStore.forRelated('deal', dealId))
const stageHistory = ref<DealStageChangeEntry[]>([])

onMounted(() => {
  activitiesStore.fetchForRelated('deal', dealId).catch(notifyApiError)
  fetchDealStageHistory(dealId).then((entries) => { stageHistory.value = entries }).catch(notifyApiError)
})

const { addActivityOpen, openAddActivity, onSubmitActivity } = useActivityList('deal', dealId, 'crm.deals.detail.addActivitySuccess')
</script>
