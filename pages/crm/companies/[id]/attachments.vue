<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.companies.detail.attachmentsHeading') }}</h3>
        <ButtonPrimary
          v-if="canManageAttachments"
          :label="t('crm.companies.detail.addAttachment')"
          icon="material-symbols:add"
          small
          @click="addAttachmentOpen = true"
        />
      </div>
      <CrmAttachmentList :attachments="companyAttachments" @remove="onRemoveAttachment" />
    </ContainerTemplate>

    <CrmAddAttachmentModal
      v-model:open="addAttachmentOpen"
      @submit="onAddAttachment"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const attachmentsStore = useAttachmentsStore()

const companyId = Number(route.params.id)

// Matches the backend's POST /attachments RBAC — same role set as Projects,
// coincidentally, but a separate backend rule, so kept as its own computed.
const canManageAttachments = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))

onMounted(() => {
  attachmentsStore.fetchForRelated('company', companyId).catch(notifyApiError)
})

const addAttachmentOpen = ref(false)
const companyAttachments = computed(() => attachmentsStore.forRelated('company', companyId))

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('company', companyId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('company', companyId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.companies.detail.addAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.companies.detail.removeAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
