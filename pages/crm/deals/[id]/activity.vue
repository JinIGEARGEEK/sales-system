<template>
  <ContainerTemplate>
    <h3 class="mb-4 text-base font-semibold">{{ t('crm.deals.detail.activityTitle') }}</h3>
    <CrmActivityTimeline :items="dealActivity" />
  </ContainerTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const activitiesStore = useActivitiesStore()

const dealId = Number(route.params.id)
const dealActivity = computed(() => activitiesStore.forRelated('deal', dealId))

onMounted(() => {
  activitiesStore.fetchForRelated('deal', dealId)
})
</script>
