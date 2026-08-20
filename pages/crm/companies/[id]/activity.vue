<template>
  <ContainerTemplate>
    <h3 class="mb-4 text-base font-semibold">{{ t('crm.companies.detail.activityFeed') }}</h3>
    <CrmActivityTimeline :items="companyActivity" />
  </ContainerTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { notifyApiError } = useApiErrorNotifier()
const activitiesStore = useActivitiesStore()

const companyId = Number(route.params.id)
const companyActivity = computed(() => activitiesStore.forRelated('company', companyId))

onMounted(() => {
  activitiesStore.fetchForRelated('company', companyId).catch(notifyApiError)
})
</script>
