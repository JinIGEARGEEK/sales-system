<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <h3 class="text-lg font-medium">{{ company?.name || t('crm.components.companyPreviewModal.title') }}</h3>
    </template>
    <template #body>
      <div v-if="company" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="company.status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ company.status === 'active' ? t('crm.companies.detail.statusActive') : t('crm.companies.detail.statusArchived') }}
          </UBadge>
          <UBadge v-for="tag in company.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
        </div>
        <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p class="text-[var(--color-gray)]">{{ t('crm.companies.detail.industry') }}</p>
            <p>{{ company.industry || '-' }}</p>
          </div>
          <div>
            <p class="text-[var(--color-gray)]">{{ t('crm.companies.detail.companySize') }}</p>
            <p>{{ company.size || '-' }}</p>
          </div>
          <div>
            <p class="text-[var(--color-gray)]">{{ t('crm.companies.detail.revenueSize') }}</p>
            <p>{{ company.revenue_size || '-' }}</p>
          </div>
          <div>
            <p class="text-[var(--color-gray)]">{{ t('crm.companies.detail.website') }}</p>
            <p>{{ company.website || '-' }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-[var(--color-gray)]">{{ t('crm.companies.detail.address') }}</p>
            <p class="whitespace-pre-wrap">{{ company.address || '-' }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-[var(--color-gray)]">{{ t('crm.companies.detail.notes') }}</p>
            <p class="whitespace-pre-wrap">{{ company.notes || '-' }}</p>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-sm text-[var(--color-gray)]">
        {{ loading ? t('crm.components.companyPreviewModal.loading') : t('crm.components.companyPreviewModal.notFound') }}
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.companyPreviewModal.close')" cancel @click="emit('update:open', false)" />
        <ButtonPrimary
          v-if="companyId"
          :label="t('crm.components.companyPreviewModal.viewFullPage')"
          outline
          @click="onViewFullPage"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { notifyApiError } = useApiErrorNotifier()
const companiesStore = useCompaniesStore()

const props = defineProps<{
  open: boolean
  companyId: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const company = computed(() => companiesStore.items.find(c => c.id === props.companyId))
const loading = ref(false)

// A linked Company may sit past fetchAll's 200-row cache (newest-first) —
// same fetchOne-on-demand pattern as pages/crm/companies/[id].vue — so it
// isn't guaranteed to already be in `items` just because a record links to it.
watch(() => [props.open, props.companyId] as const, async ([isOpen, id]) => {
  if (!isOpen || !id) return
  if (companiesStore.items.some(c => c.id === id)) return
  loading.value = true
  try {
    await companiesStore.fetchOne(id)
  } catch (err) {
    notifyApiError(err)
  } finally {
    loading.value = false
  }
}, { immediate: true })

const onViewFullPage = () => {
  if (!props.companyId) return
  emit('update:open', false)
  navigateTo(`/crm/companies/${props.companyId}`)
}
</script>
