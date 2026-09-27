<template>
  <InputText
    v-model="taxId"
    :label="t('crm.companies.taxFields.taxId')"
    :placeholder="t('crm.companies.taxFields.taxIdPlaceholder')"
    name="tax_id"
    rules="tax_id"
    maxlength="17"
    inputmode="numeric"
    data-cy="company-tax-id"
  />
  <InputText
    v-model="branchCode"
    :label="t('crm.companies.taxFields.branchCode')"
    :placeholder="t('crm.companies.taxFields.branchCodePlaceholder')"
    name="branch_code"
    rules="digits:5"
    maxlength="5"
    inputmode="numeric"
    data-cy="company-branch-code"
  >
    <template v-if="branchLabel" #label-suffix>
      <UBadge color="neutral" variant="subtle" size="sm" class="ml-2 align-middle" data-cy="company-branch-label">{{ branchLabel }}</UBadge>
    </template>
  </InputText>
  <InputText
    v-model="postalCode"
    :label="t('crm.companies.taxFields.postalCode')"
    :placeholder="t('crm.companies.taxFields.postalCodePlaceholder')"
    name="postal_code"
    rules="digits:5"
    maxlength="5"
    inputmode="numeric"
    data-cy="company-postal-code"
  />
  <UAlert
    v-if="duplicate"
    class="md:col-span-2"
    :color="duplicateBlocksSave ? 'error' : 'warning'"
    variant="subtle"
    :icon="duplicateBlocksSave ? 'material-symbols:error-outline' : 'material-symbols:warning-outline'"
    :title="branchCode ? t('crm.companies.taxFields.duplicateBranchTitle') : t('crm.companies.taxFields.duplicateTitle')"
    data-cy="company-tax-id-duplicate"
  >
    <template #description>
      <NuxtLink :to="`/crm/companies/${duplicate.id}`" class="font-medium underline">{{ companyName(duplicate.name) }}</NuxtLink>
      <span v-if="duplicate.branch_code"> · {{ branchName(duplicate.branch_code) }}</span>
      <p v-if="duplicateBlocksSave" class="mt-1" data-cy="company-tax-id-duplicate-blocked">{{ t('crm.companies.taxFields.duplicateBlocked') }}</p>
    </template>
  </UAlert>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Tax ID / Branch Code / Postal Code — the Thai tax-invoice buyer fields,
// shared by the Company create and detail forms. Renders as bare grid items
// (no wrapper) so it drops into the parent form's two-column grid.
const { t } = useI18n()
const { companyName } = useCompanyName()

const props = defineProps<{
  // The Company being edited, skipped by the duplicate warning.
  excludeId?: number
  // Create form only: a valid tax ID typed with the branch still blank
  // fills in "00000" (head office, by far the common case). Off on the
  // detail form, whose async hydration would otherwise fill it on load and
  // leave a freshly opened record dirty.
  autofillHeadOffice?: boolean
}>()

const taxId = defineModel<string>('taxId', { default: '' })
const branchCode = defineModel<string>('branchCode', { default: '' })
const postalCode = defineModel<string>('postalCode', { default: '' })

const branchName = (code: string) => code === HEAD_OFFICE_BRANCH_CODE
  ? t('crm.companies.taxFields.headOffice')
  : t('crm.companies.taxFields.branchNumber', { code })

const branchLabel = computed(() => isFiveDigitCode(branchCode.value) ? branchName(branchCode.value) : '')

watch(taxId, (value) => {
  if (props.autofillHeadOffice && !branchCode.value && isValidThaiTaxId(value)) {
    branchCode.value = HEAD_OFFICE_BRANCH_CODE
  }
})

const { duplicate, blocksSave: duplicateBlocksSave } = useCompanyTaxIdDuplicate(taxId, branchCode, props.excludeId)
</script>
