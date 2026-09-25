<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.quotesTitle') }}</h3>
        <div class="flex flex-wrap gap-2">
          <ButtonPrimary
            :label="t('crm.deals.detail.createQuote')"
            icon="material-symbols:add"
            outline
            small
            @click="navigateTo(`/crm/quotes/create?deal_id=${dealId}`)"
          />
          <input
            ref="fileInputRef"
            type="file"
            accept="application/pdf"
            class="hidden"
            @change="onFileSelected"
          >
          <ButtonPrimary
            :label="t('crm.deals.detail.uploadQuotation')"
            icon="material-symbols:upload-file-outline"
            small
            @click="fileInputRef?.click()"
          />
        </div>
      </div>

      <div v-if="dealQuotes.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
        {{ t('crm.deals.detail.noQuotes') }}
      </div>
      <div v-else class="flex flex-col gap-3">
        <div v-for="quote in dealQuotes" :key="quote.id" class="rounded-lg border border-(--color-light-gray-2) p-4">
          <!-- Wraps below ~400px: select + validity text + action icons don't
               fit one non-wrapping row on a phone. -->
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <UBadge v-if="!quote.file_name" :color="quoteStatusBadgeColor(quote.status)" variant="subtle">{{ quote.status }}</UBadge>
            <!-- Uploaded (PDF) quotes have no structured-items editor page of
            their own (pages/crm/quotes/[id].vue is items-only), so this is
            the only place their status can move past Draft. -->
            <InputSelect
              v-else
              :key="`quote-status-${quote.id}-${statusSelectResetKey}`"
              :model-value="quote.status"
              :options="QUOTE_STATUS_OPTIONS"
              small
              class="w-36 shrink-0"
              :name="`quote-status-${quote.id}`"
              :data-cy="`quote-status-${quote.id}`"
              @update:model-value="(value: string) => requestQuoteStatusChange(quote, value as QuoteStatus)"
            />
            <div class="flex min-w-0 flex-wrap items-center gap-3">
              <span class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.validUntil', { date: quote.validity_date ? dateFormat(quote.validity_date.toISOString()) : '-' }) }}</span>
              <template v-if="!quote.file_name">
                <UButton
                  icon="material-symbols:edit-outline"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :aria-label="t('crm.deals.detail.editQuote')"
                  @click="navigateTo(`/crm/quotes/${quote.id}`)"
                />
                <UButton
                  icon="material-symbols:download"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :aria-label="t('crm.deals.detail.downloadPdf')"
                  @click="onExportQuotePdf(quote.id)"
                />
              </template>
            </div>
          </div>

          <div v-if="quote.file_name" class="flex items-center justify-between gap-3 rounded-lg bg-(--color-light-gray-1) p-3">
            <div class="flex min-w-0 items-center gap-3">
              <UIcon name="material-symbols:picture-as-pdf-outline" class="size-8 shrink-0 text-(--color-danger-toast)" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ quote.file_name }}</p>
                <p class="text-xs text-(--color-gray)">
                  {{ formatFileSize(quote.file_size) }} · {{ t('crm.deals.detail.uploadedOn', { date: quote.uploaded_at ? dateTimeFormat(quote.uploaded_at.toISOString()) : '-' }) }}
                </p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <UButton
                :to="quote.file_url"
                target="_blank"
                icon="material-symbols:open-in-new"
                variant="ghost"
                color="neutral"
                size="xs"
                :aria-label="t('crm.deals.detail.viewPdf')"
              />
              <UButton
                icon="material-symbols:delete-outline"
                variant="ghost"
                color="error"
                size="xs"
                :aria-label="t('crm.deals.detail.removeQuotation')"
                @click="requestDelete(quote)"
              />
            </div>
          </div>

          <template v-else>
            <p v-if="quote.scope_of_work" class="mb-2 whitespace-pre-wrap text-sm text-(--color-gray)">{{ quote.scope_of_work }}</p>
            <div class="overflow-x-auto">
              <table class="w-full min-w-80 text-sm">
                <tbody>
                  <tr v-for="(item, index) in quote.items" :key="index" class="border-t border-(--color-light-gray-2)">
                    <td class="max-w-60 truncate py-1">{{ item.description }}</td>
                    <td class="py-1 text-right whitespace-nowrap">x{{ item.qty }}</td>
                    <td class="py-1 text-right whitespace-nowrap">{{ t('global.currencySymbol') }}{{ priceFormat(item.price * item.qty) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </ContainerTemplate>

    <!-- Accepted/Rejected/Expired record the customer's decision and are hard
         to walk back — confirmed first; cancelling re-renders the select back
         to the saved status. -->
    <CrmConfirmDeleteModal
      :open="pendingStatusChange !== null"
      :title="t('crm.deals.detail.confirmQuoteStatusTitle')"
      :body="pendingStatusChange ? t('crm.deals.detail.confirmQuoteStatusBody', { status: quoteStatusLabel(pendingStatusChange.status) }) : ''"
      :confirm-label="t('crm.deals.detail.confirmQuoteStatusConfirm')"
      :confirm-color="pendingStatusChange?.status === 'accepted' ? 'primary' : 'error'"
      @update:open="(value: boolean) => { if (!value) cancelQuoteStatusChange() }"
      @confirm="confirmQuoteStatusChange"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :body="target ? t('crm.deals.detail.removeQuotationConfirmBody', { name: target.file_name || target.number || `#${target.id}` }) : ''"
      @confirm="confirmRemoveQuote"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MAX_QUOTATION_FILE_SIZE, useDownloadPdfBlob } from '~/composables/utils/usePdfExport'
import { QUOTE_STATUS_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const { priceFormat, dateFormat, dateTimeFormat } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const quotesStore = useQuotesStore()
const downloadPdfBlob = useDownloadPdfBlob()
const { quoteStatusBadgeColor } = useQuoteStatusColor()

const { dealId } = useCurrentDeal()
const dealQuotes = computed(() => quotesStore.forDeal(dealId))

onMounted(() => {
  quotesStore.fetchForDeal(dealId).catch(notifyApiError)
})

const fileInputRef = ref<HTMLInputElement | null>(null)

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (file.type !== 'application/pdf') {
    error(t('crm.deals.detail.invalidFileType'))
    return
  }
  if (file.size > MAX_QUOTATION_FILE_SIZE) {
    error(t('crm.deals.detail.fileTooLarge'))
    return
  }

  try {
    await quotesStore.upload(dealId, file)
    success(t('crm.deals.detail.uploadSuccess'))
  } catch (err) {
    notifyApiError(err)
  }
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Quote>()

const confirmRemoveQuote = async () => {
  if (!target.value) return
  try {
    await quotesStore.remove(target.value.id)
    success(t('crm.deals.detail.removeQuotationSuccess'))
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeDelete()
  }
}

const onUpdateQuoteStatus = async (id: number, status: QuoteStatus) => {
  try {
    // updateStatus rebuilds the full PUT payload from the loaded Quote.
    await quotesStore.updateStatus(id, status)
    success(t('crm.deals.detail.updateQuoteStatusSuccess'))
  } catch (err) {
    notifyApiError(err)
    // Snap the select back to the still-saved status on failure too.
    statusSelectResetKey.value++
  }
}

const CONFIRMED_QUOTE_STATUSES: QuoteStatus[] = ['accepted', 'rejected', 'expired']
const quoteStatusLabel = (status: QuoteStatus) => QUOTE_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status

const pendingStatusChange = ref<{ quote: Quote, status: QuoteStatus } | null>(null)
// Bumped to remount the inline selects (via :key) so a cancelled or failed
// change visibly reverts to the saved status instead of keeping the picked one.
const statusSelectResetKey = ref(0)

const requestQuoteStatusChange = (quote: Quote, status: QuoteStatus) => {
  if (status === quote.status) return
  if (CONFIRMED_QUOTE_STATUSES.includes(status)) {
    pendingStatusChange.value = { quote, status }
    return
  }
  onUpdateQuoteStatus(quote.id, status)
}

const cancelQuoteStatusChange = () => {
  pendingStatusChange.value = null
  statusSelectResetKey.value++
}

const confirmQuoteStatusChange = async () => {
  const pending = pendingStatusChange.value
  if (!pending) return
  await onUpdateQuoteStatus(pending.quote.id, pending.status)
  pendingStatusChange.value = null
}

const onExportQuotePdf = (quoteId: number) => downloadPdfBlob(`/quotes/${quoteId}/export-pdf`, `quote-${quoteId}.pdf`)
</script>
