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

    <CrmAddActivityModal
      v-model:open="addActivityOpen"
      @submit="onSubmitActivity"
    />
  </ContainerTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { notifyApiError } = useApiErrorNotifier()
const activitiesStore = useActivitiesStore()

const dealId = Number(route.params.id)
const dealActivity = computed(() => activitiesStore.forRelated('deal', dealId))

onMounted(() => {
  activitiesStore.fetchForRelated('deal', dealId).catch(notifyApiError)
})

const { addActivityOpen, openAddActivity, onSubmitActivity } = useActivityList('deal', dealId, 'crm.deals.detail.addActivitySuccess')
</script>
