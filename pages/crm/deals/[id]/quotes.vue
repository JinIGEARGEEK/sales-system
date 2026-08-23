<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.quotesTitle') }}</h3>
        <div class="flex gap-2">
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

      <div v-if="dealQuotes.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.deals.detail.noQuotes') }}
      </div>
      <div v-else class="flex flex-col gap-3">
        <div v-for="quote in dealQuotes" :key="quote.id" class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
          <div class="mb-2 flex items-center justify-between">
            <UBadge :color="quoteStatusBadgeColor(quote.status)" variant="subtle">{{ quote.status }}</UBadge>
            <div class="flex items-center gap-3">
              <span class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.validUntil', { date: quote.validity_date ? dateFormat(quote.validity_date.toISOString()) : '-' }) }}</span>
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

          <div v-if="quote.file_name" class="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-light-gray-1)] p-3">
            <div class="flex min-w-0 items-center gap-3">
              <UIcon name="material-symbols:picture-as-pdf-outline" class="size-8 shrink-0 text-[var(--color-danger-toast)]" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ quote.file_name }}</p>
                <p class="text-xs text-[var(--color-gray)]">
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
                @click="onRemoveQuote(quote)"
              />
            </div>
          </div>

          <template v-else>
            <p v-if="quote.scope_of_work" class="mb-2 whitespace-pre-wrap text-sm text-[var(--color-gray)]">{{ quote.scope_of_work }}</p>
            <table class="w-full text-sm">
              <tbody>
                <tr v-for="(item, index) in quote.items" :key="index" class="border-t border-[var(--color-light-gray-2)]">
                  <td class="py-1">{{ item.description }}</td>
                  <td class="py-1 text-right">x{{ item.qty }}</td>
                  <td class="py-1 text-right">{{ t('global.currencySymbol') }}{{ priceFormat(item.price * item.qty) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MAX_QUOTATION_FILE_SIZE, useDownloadPdfBlob } from '~/composables/utils/usePdfExport'

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

const onRemoveQuote = async (quote: Quote) => {
  try {
    await quotesStore.remove(quote.id)
  } catch (err) {
    notifyApiError(err)
  }
}

const onExportQuotePdf = (quoteId: number) => downloadPdfBlob(`/quotes/${quoteId}/export-pdf`, `quote-${quoteId}.pdf`)
</script>
