<template>
  <!-- Not dismissible mid-import: closing would hide an in-flight loop that
  keeps creating records in the background. -->
  <UModal
    :open="open"
    :title="t('crm.components.importModal.title')"
    :description="t('crm.components.importModal.description')"
    :dismissible="!importing"
    :close="!importing"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <!-- sr-only, not `hidden`: a display:none input can't take focus, so
        the picker was mouse-only. The label stays the visible target and
        shows the focus ring for it. -->
        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--color-light-gray-2) p-6 text-center hover:bg-(--color-light-gray-1) has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-(--color-focus)"
        >
          <UIcon name="material-symbols:upload-file-outline" class="size-8 text-(--color-gray)" />
          <span class="text-sm font-medium">{{ fileName || t('crm.components.importModal.chooseFile') }}</span>
          <span class="text-xs text-(--color-gray)">{{ t('crm.components.importModal.acceptedFormats') }}</span>
          <input type="file" accept=".csv,.xls,.xlsx" class="sr-only" :disabled="importing" @change="onFileChange" >
        </label>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="material-symbols:error-outline"
          :title="error"
        />

        <UAlert
          v-if="importResult"
          color="warning"
          variant="subtle"
          icon="material-symbols:warning-outline"
          :title="t('crm.components.importModal.resultSummary', { companies: importResult.companies, contacts: importResult.contacts, count: importResult.rowErrors.length })"
          data-cy="import-contacts-row-errors"
        >
          <template #description>
            <ul class="mt-1 list-disc pl-5">
              <li v-for="rowError in importResult.rowErrors" :key="`${rowError.row}-${rowError.message}`">
                {{ t('crm.components.importModal.rowError', { row: rowError.row, name: rowError.name, message: rowError.message }) }}
              </li>
            </ul>
          </template>
        </UAlert>

        <div v-if="preview" class="flex flex-col gap-2 rounded-lg bg-(--color-light-gray-1) p-3 text-sm">
          <p>{{ t('crm.components.importModal.previewSummary', { rows: preview.totalRows }) }}</p>
          <ul class="list-disc pl-5 text-(--color-gray)">
            <li>{{ t('crm.components.importModal.previewCompanies', { count: preview.newCompanies, existing: preview.existingCompanies }) }}</li>
            <li>{{ t('crm.components.importModal.previewContacts', { count: preview.newContacts }) }}</li>
            <li v-if="preview.skipped > 0">{{ t('crm.components.importModal.previewSkipped', { count: preview.skipped }) }}</li>
          </ul>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="importResult ? t('crm.components.importModal.close') : t('crm.components.importModal.cancel')" cancel :disabled="importing" @click="onUpdateOpen(false)" />
        <ButtonPrimary
          :label="t('crm.components.importModal.confirmImport')"
          :disabled="importing || !preview || preview.newCompanies + preview.newContacts === 0"
          :loading="importing"
          :loading-auto="false"
          data-cy="import-contacts-confirm"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { duplicateFieldsLabel } from '~/composables/utils/useDuplicateConflict'
import type { FlowAccountRow } from '~/composables/utils/flowAccountImport'

const { t, te } = useI18n()
const { notifyApiError } = useApiErrorNotifier()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  imported: [summary: { companies: number, contacts: number }]
}>()

const fileName = ref('')
const error = ref('')
const parsedRows = ref<FlowAccountRow[]>([])
// Existing Company per normalized tax_id|branch_code key found on the
// server at preview time (null = looked up, none found).
const taxIdMatches = ref(new Map<string, Company | null>())
let latestParseId = 0
const preview = ref<{ totalRows: number, newCompanies: number, existingCompanies: number, newContacts: number, skipped: number } | null>(null)
// Set once an import finished with rows the API refused (a duplicate
// contact, a 422 field, a company that no longer exists): the modal stays
// open on this list instead of closing, so nothing is dropped silently.
interface ImportRowError {
  row: number
  name: string
  message: string
}
const importResult = ref<{ companies: number, contacts: number, rowErrors: ImportRowError[] } | null>(null)

const onUpdateOpen = (value: boolean) => {
  if (!value) {
    fileName.value = ''
    error.value = ''
    parsedRows.value = []
    taxIdMatches.value = new Map()
    preview.value = null
    importResult.value = null
  }
  emit('update:open', value)
}

const taxIdKey = (row: FlowAccountRow) => `${row.validTaxId}|${row.validBranchCode}`
const companyKey = (row: FlowAccountRow) => row.validTaxId ? `tax:${taxIdKey(row)}` : `name:${row.name.trim().toLowerCase()}`

// Tax ID + branch identifies the buyer even when the name is spelled
// differently ("บจก. …" vs "บริษัท … จำกัด"), so it wins over the name match.
const findExistingCompany = (row: FlowAccountRow) =>
  (row.validTaxId ? taxIdMatches.value.get(taxIdKey(row)) : null) ?? companiesStore.findByName(row.name) ?? null

const lookupTaxIdMatches = async (rows: FlowAccountRow[]) => {
  const matches = new Map<string, Company | null>()
  const pending = [...new Set(rows.filter(r => r.validTaxId).map(taxIdKey))]
  // A few requests at a time rather than one per row all at once.
  const worker = async () => {
    for (let key = pending.shift(); key !== undefined; key = pending.shift()) {
      const [taxId, branchCode] = key.split('|')
      try {
        matches.set(key, await companiesStore.findByTaxId(taxId!, branchCode || undefined))
      } catch {
        // Falls back to the name match for this row.
        matches.set(key, null)
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  return matches
}

// The Company fields an existing record is missing that this row can fill.
const backfillFor = (company: Company, row: FlowAccountRow) => {
  const changes: Partial<CompanyUpdatePayload> = {}
  const address = flowAccountAddress(row)
  if (!company.tax_id && row.validTaxId) changes.tax_id = row.validTaxId
  if (!company.branch_code && row.validBranchCode) changes.branch_code = row.validBranchCode
  if (!company.postal_code && row.validPostalCode) changes.postal_code = row.validPostalCode
  if (!company.address && address) changes.address = address
  return changes
}

const onFileChange = async (event: Event) => {
  error.value = ''
  preview.value = null
  importResult.value = null
  parsedRows.value = []

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  fileName.value = file.name

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined
    if (!sheet) {
      error.value = t('crm.components.importModal.errorNoHeader')
      return
    }
    const parsed = parseFlowAccountRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' }))
    if (!parsed.ok) {
      error.value = t(parsed.reason === 'noHeader' ? 'crm.components.importModal.errorNoHeader' : 'crm.components.importModal.errorNoRows')
      return
    }
    const result = parsed.rows

    // Tax ID lookups hit the server (not the capped companies cache), so a
    // second file picked while they run must not overwrite this one's preview.
    const parseId = ++latestParseId
    const matches = await lookupTaxIdMatches(result)
    if (parseId !== latestParseId) return
    taxIdMatches.value = matches
    parsedRows.value = result

    // Counted per distinct company (tax ID + branch, else name), so a
    // company repeated across rows — one per contact — counts once.
    const seen = new Set<string>()
    let newCompanies = 0
    let existingCompanies = 0
    let newContacts = 0
    for (const row of result) {
      const key = companyKey(row)
      if (!seen.has(key)) {
        seen.add(key)
        if (findExistingCompany(row)) {
          existingCompanies += 1
        } else {
          newCompanies += 1
        }
      }
      if (row.contactName) newContacts += 1
    }

    preview.value = {
      totalRows: result.length,
      newCompanies,
      existingCompanies,
      newContacts,
      skipped: parsed.skipped,
    }
  } catch {
    error.value = t('crm.components.importModal.errorParseFailed')
  }
}

// Re-entry guard for the sequential create loop below: without it, a double
// click on Import (or a click while a previous run is still going) starts a
// second loop that races the first — both see a company as not-yet-existing
// and both create it, leaving duplicates.
const importing = ref(false)

// A 409/422 on one row is that row's problem (bad or duplicate data), so it
// goes in the per-row list and the import carries on; anything else (network,
// 5xx, 403) still stops the run below. Returns null for the latter.
const rowFailureText = (err: unknown): string | null => {
  const code = getApiErrorCode(err)
  if (code !== 'VALIDATION_ERROR' && code !== 'CONFLICT') return null
  const fields = getApiErrorFields(err)
  if (fields?.company_id?.includes('not_found')) return t('crm.components.importModal.rowCompanyNotFound')
  if (!fields || Object.keys(fields).length === 0) return getApiErrorMessage(err, t('global.genericError'))
  return Object.entries(fields).map(([field, codes]) => {
    const labelKey = `crm.components.importModal.fields.${field}`
    return `${te(labelKey) ? t(labelKey) : field}: ${apiFieldErrorMessage(codes?.[0], t, te)}`
  }).join(' ')
}

const onConfirm = async () => {
  if (importing.value) return
  importing.value = true
  let companiesCreated = 0
  let contactsCreated = 0
  const rowErrors: ImportRowError[] = []
  const fail = (row: FlowAccountRow, message: string) => rowErrors.push({ row: row.sheetRow, name: row.name, message })

  try {
    for (const row of parsedRows.value) {
      const tag = flowAccountTag(row)

      let company = findExistingCompany(row)
      if (!company) {
        try {
          company = await companiesStore.add({
            name: row.name,
            industry: '',
            size: '',
            revenue_size: '',
            website: '',
            tags: tag ? [tag] : [],
            notes: flowAccountNotes(row),
            status: 'active',
            legal_name: null,
            address: flowAccountAddress(row) || null,
            tax_id: row.validTaxId || null,
            branch_code: row.validBranchCode || null,
            postal_code: row.validPostalCode || null,
            created_at: new Date(),
            updated_at: new Date(),
            last_activity_at: null,
          })
        } catch (err) {
          const message = rowFailureText(err)
          if (message === null) throw err
          fail(row, t('crm.components.importModal.rowCompanyFailed', { message }))
          continue
        }
        companiesCreated += 1
      } else {
        const changes = backfillFor(company, row)
        if (Object.keys(changes).length > 0) {
          try {
            // Full-record PUT (the API overwrites every field): resend the
            // whole Company with only the blanks filled in.
            company = await companiesStore.update(company.id, fullCompanyUpdatePayload(company, changes))
          } catch {
            // Best-effort — e.g. a size option since deactivated fails the
            // PUT's validation; keep importing the rest.
          }
        }
        if (tag) companiesStore.addTag(company.id, tag)
      }
      // Later rows for the same tax ID + branch reuse this Company.
      if (row.validTaxId) taxIdMatches.value.set(taxIdKey(row), company)

      if (row.contactName && company) {
        const alreadyLinked = contactsStore.items.some(
          c => c.company_id === company!.id && c.name.trim().toLowerCase() === row.contactName.trim().toLowerCase(),
        )
        if (!alreadyLinked) {
          try {
            await contactsStore.add({
              company_id: company.id,
              name: row.contactName,
              email: row.email,
              phone: row.mobile || row.officePhone,
              role_title: '',
              tags: [],
              status: 'active',
              is_primary: false,
              created_at: new Date(),
            })
            contactsCreated += 1
          } catch (err) {
            // POST /contacts is a 409 when another Contact (any Company) has
            // the same email/phone. An import never forces a duplicate in —
            // the row is listed so the user can check the existing one.
            const duplicate = getDuplicateConflict(err)
            if (duplicate) {
              fail(row, t('crm.components.importModal.rowDuplicateContact', { contact: row.contactName, fields: duplicateFieldsLabel(duplicate.fields, t) }))
              continue
            }
            const message = rowFailureText(err)
            if (message === null) throw err
            fail(row, t('crm.components.importModal.rowContactFailed', { contact: row.contactName, message }))
          }
        }
      }
    }
  } catch (err) {
    // A failure mid-loop still leaves whatever was already created — surface
    // the error, but don't discard the partial progress by closing silently
    // or re-throwing; the modal stays open so the user can see what happened
    // and retry (re-running is safe: findByName/alreadyLinked skip repeats).
    notifyApiError(err)
    return
  } finally {
    importing.value = false
  }

  emit('imported', { companies: companiesCreated, contacts: contactsCreated })
  if (rowErrors.length > 0) {
    // Stay open on the per-row list; the parsed file is spent, so Import is
    // disabled until another file is picked.
    importResult.value = { companies: companiesCreated, contacts: contactsCreated, rowErrors }
    preview.value = null
    parsedRows.value = []
    return
  }
  onUpdateOpen(false)
}
</script>
