<template>
  <div>
    <div v-if="!canAccess" class="p-10 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.contracts.detail.noAccess') }}
    </div>
    <ContainerTemplate v-else>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.contracts.detail.title') }}</h3>
        <div class="flex gap-2">
          <ButtonPrimary
            :label="t('crm.contracts.detail.createContract')"
            icon="material-symbols:add"
            small
            @click="addContractOpen = true"
          />
          <input
            ref="contractFileInputRef"
            type="file"
            accept="application/pdf"
            class="hidden"
            @change="onContractFileSelected"
          >
        </div>
      </div>

      <div v-if="dealContracts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.contracts.detail.noContracts') }}
      </div>
      <div v-else class="flex flex-col gap-3">
        <div v-for="contract in dealContracts" :key="contract.id" class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
          <div class="mb-2 flex items-center justify-between">
            <UBadge color="neutral" variant="subtle">{{ contract.status }}</UBadge>
            <div class="flex items-center gap-3">
              <span class="text-xs text-[var(--color-gray)]">
                {{ contract.quote_id ? t('crm.contracts.detail.linkedQuote', { id: contract.quote_id }) : t('crm.contracts.detail.noLinkedQuote') }}
              </span>
              <UButton
                icon="material-symbols:download"
                variant="ghost"
                color="neutral"
                size="xs"
                :aria-label="t('crm.contracts.detail.downloadPdf')"
                @click="onExportContractPdf(contract.id)"
              />
            </div>
          </div>

          <div v-if="contract.signed_file_url" class="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-light-gray-1)] p-3">
            <div class="flex min-w-0 items-center gap-3">
              <UIcon name="material-symbols:picture-as-pdf-outline" class="size-8 shrink-0 text-[var(--color-danger-toast)]" />
              <p class="truncate text-sm font-medium">
                {{ contract.signed_date ? t('crm.contracts.detail.uploadedOn', { date: dateTimeFormat(contract.signed_date.toISOString()) }) : '-' }}
              </p>
            </div>
            <UButton
              :to="contract.signed_file_url"
              target="_blank"
              icon="material-symbols:open-in-new"
              variant="ghost"
              color="neutral"
              size="xs"
              :aria-label="t('crm.contracts.detail.viewDocument')"
            />
          </div>
          <ButtonPrimary
            v-else
            :label="t('crm.contracts.detail.uploadSignedDocument')"
            icon="material-symbols:upload-file-outline"
            outline
            small
            @click="triggerContractUpload(contract.id)"
          />
        </div>
      </div>
    </ContainerTemplate>

    <CrmAddContractModal
      v-model:open="addContractOpen"
      :quotes="dealQuotes"
      @submit="onAddContract"
    />

    <CrmAddProjectModal
      v-model:open="projectModal"
      :title="t('crm.deals.detail.createProjectModalTitle')"
      :default-name="deal?.title"
      :description="t('crm.deals.detail.createProjectModalBody')"
      @submit="onCreateProject"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MAX_QUOTATION_FILE_SIZE, useDownloadPdfBlob } from '~/composables/utils/usePdfExport'

const { t } = useI18n()

const { dateTimeFormat } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const contractsStore = useContractsStore()
const quotesStore = useQuotesStore()
const downloadPdfBlob = useDownloadPdfBlob()
const { hasRole } = useRole()

// Contracts carry pricing/terms — Production only needs Deal/Project status, not this.
// Matches GET /contracts' RBAC (Admin/Sales Rep/Sales Manager).
const canAccess = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))

const { dealId, deal } = useCurrentDeal()
const dealContracts = computed(() => contractsStore.forDeal(dealId))
// The "create contract" modal offers linking to one of the deal's quotes, so
// this tab needs the Quotes store populated even if the Quotes tab hasn't
// been visited yet in this session.
const dealQuotes = computed(() => quotesStore.forDeal(dealId))

onMounted(() => {
  if (!canAccess.value) return
  contractsStore.fetchForDeal(dealId).catch(notifyApiError)
  quotesStore.fetchForDeal(dealId).catch(notifyApiError)
})

const addContractOpen = ref(false)

// Mirrors the existing Deal-Won -> Create Project prompt (pages/crm/deals/[id].vue,
// same composable): signing a Contract is just as much a real "we now have a
// customer engagement" moment, so it gets the same auto-open-the-project-modal
// treatment (FR-CRM-048).
const { projectModal, promptCreateProject, onCreateProject } = useCreateProjectFromDeal(deal)
const promptProjectIfSigned = (contract: { status: ContractStatus }) => {
  if (contract.status === 'signed') promptCreateProject()
}

const onAddContract = async (contract: { status: ContractStatus, quote_id?: number }) => {
  try {
    const created = await contractsStore.add(dealId, contract)
    success(t('crm.contracts.detail.createSuccess'))
    promptProjectIfSigned(created)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

// The signed-document upload is scoped to a specific Contract (POST /contracts/:id/upload),
// not the Deal, so the hidden file input's target contract is tracked separately from
// which button triggered it — mirrors the click-to-open-file-picker pattern used for Quotes.
const pendingContractUploadId = ref<number | null>(null)
const contractFileInputRef = ref<HTMLInputElement | null>(null)

const triggerContractUpload = (contractId: number) => {
  pendingContractUploadId.value = contractId
  contractFileInputRef.value?.click()
}

const onContractFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const contractId = pendingContractUploadId.value
  input.value = ''
  pendingContractUploadId.value = null
  if (!file || !contractId) return

  if (file.type !== 'application/pdf') {
    error(t('crm.contracts.detail.invalidFileType'))
    return
  }
  if (file.size > MAX_QUOTATION_FILE_SIZE) {
    error(t('crm.contracts.detail.fileTooLarge'))
    return
  }

  try {
    const updated = await contractsStore.upload(contractId, file)
    success(t('crm.contracts.detail.uploadSuccess'))
    promptProjectIfSigned(updated)
  } catch (err) {
    notifyApiError(err)
  }
}

const onExportContractPdf = (contractId: number) => downloadPdfBlob(`/contracts/${contractId}/export-pdf`, `contract-${contractId}.pdf`)
</script>
