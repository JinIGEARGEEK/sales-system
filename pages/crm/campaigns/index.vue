<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 class="text-xl font-black">{{ t('crm.campaigns.index.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.campaigns.index.subheading') }}</p>
        </div>
        <ButtonPrimary
          icon="material-symbols:campaign-outline"
          :label="t('crm.campaigns.index.startCampaign')"
          data-cy="start-campaign-button"
          @click="navigateTo('/crm/campaigns/new')"
        />
      </div>

      <div v-if="campaignsStore.items.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.campaigns.index.noCampaigns') }}
      </div>

      <div v-else class="flex flex-col gap-3">
        <ContainerTemplate v-for="campaign in campaignsStore.items" :key="campaign.id">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <NuxtLink :to="`/crm/tasks?campaign_id=${campaign.id}`" class="text-base font-semibold hover:underline" :data-cy="`campaign-link-${campaign.id}`">
                {{ campaign.name }}
              </NuxtLink>
              <p class="text-xs text-[var(--color-gray)]">
                {{ t(`crm.campaigns.index.type.${campaign.type}`) }} · {{ dateFormat(campaign.created_at) }}
              </p>
            </div>

            <div v-if="progressFor(campaign.id)" class="flex flex-col items-start gap-1 sm:items-end">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="neutral" variant="subtle">{{ t('crm.campaigns.index.progress.total', { count: progressFor(campaign.id)!.total }) }}</UBadge>
                <UBadge color="success" variant="subtle">{{ t('crm.campaigns.index.progress.done', { count: progressFor(campaign.id)!.done }) }}</UBadge>
                <UBadge color="warning" variant="subtle">{{ t('crm.campaigns.index.progress.pending', { count: progressFor(campaign.id)!.pending }) }}</UBadge>
                <UBadge color="info" variant="subtle">{{ t('crm.campaigns.index.progress.converted', { count: progressFor(campaign.id)!.converted }) }}</UBadge>
              </div>
              <p class="text-xs text-[var(--color-gray)]">{{ t('crm.campaigns.index.convertedHint') }}</p>
            </div>
            <USkeleton v-else class="h-6 w-48" />
          </div>

          <UProgress
            v-if="progressFor(campaign.id)"
            class="mt-3"
            :model-value="progressPercent(progressFor(campaign.id)!)"
          />
        </ContainerTemplate>
      </div>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.campaigns.index.pageTitle') })

// Same gating as /crm/tasks — Campaigns are just a bulk-creation entry point
// for Tasks, so anyone who can see Tasks can see Campaigns.
const { canAccess, guardMounted } = usePageAccess(...TASK_ROLES)

const { notifyApiError } = useApiErrorNotifier()
const { dateFormat } = useFormatter()
const campaignsStore = useCampaignsStore()

const progressByCampaign = ref<Record<number, CampaignProgress>>({})

guardMounted(async () => {
  await campaignsStore.fetchAll().catch(notifyApiError)
  for (const campaign of campaignsStore.items) {
    campaignsStore.fetchProgress(campaign.id)
      .then((progress) => { progressByCampaign.value[campaign.id] = progress })
      .catch(notifyApiError)
  }
})

const progressFor = (campaignId: number): CampaignProgress | undefined => progressByCampaign.value[campaignId]
const progressPercent = (progress: CampaignProgress) => (progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100))
</script>
