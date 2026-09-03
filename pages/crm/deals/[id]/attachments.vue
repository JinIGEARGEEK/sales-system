<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.attachmentsTitle') }}</h3>
        <ButtonPrimary
          v-if="canManageAttachments"
          :label="t('crm.deals.detail.addAttachment')"
          icon="material-symbols:add"
          small
          @click="addAttachmentOpen = true"
        />
      </div>
      <CrmAttachmentList :attachments="dealAttachments" @remove="onRemoveAttachment" />
    </ContainerTemplate>

    <CrmAddAttachmentModal
      v-model:open="addAttachmentOpen"
      @submit="onAddAttachment"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

const { t } = useI18n()

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const attachmentsStore = useAttachmentsStore()

const dealId = Number(route.params.id)

// Matches the backend's POST /attachments RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — internal/routes/routes.go. Same role set as
// SALES_PIPELINE_ROLES, so reuse it rather than re-listing the same 3 roles.
const canManageAttachments = computed(() => hasRole(...SALES_PIPELINE_ROLES))

onMounted(() => {
  attachmentsStore.fetchForRelated('deal', dealId).catch(notifyApiError)
})

const addAttachmentOpen = ref(false)
const dealAttachments = computed(() => attachmentsStore.forRelated('deal', dealId))

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('deal', dealId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('deal', dealId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.deals.detail.addAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.deals.detail.removeAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
