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
        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--color-light-gray-2) p-6 text-center hover:bg-(--color-light-gray-1)"
        >
          <UIcon name="material-symbols:upload-file-outline" class="size-8 text-(--color-gray)" />
          <span class="text-sm font-medium">{{ fileName || t('crm.components.importModal.chooseFile') }}</span>
          <span class="text-xs text-(--color-gray)">{{ t('crm.components.importModal.acceptedFormats') }}</span>
          <input type="file" accept=".csv,.xls,.xlsx" class="hidden" :disabled="importing" @change="onFileChange" >
        </label>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="material-symbols:error-outline"
          :title="error"
        />

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
        <ButtonPrimary :label="t('crm.components.importModal.cancel')" cancel :disabled="importing" @click="onUpdateOpen(false)" />
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

const { t } = useI18n()
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

// FlowAccount "สมุดรายชื่อ" (address book) export column headers, matched by
// exact text rather than position — tolerant of columns being reordered or
// extra ones being present, since this is a fixed third-party export format
// we don't control.
const HEADER_MAP: Record<string, string> = {
  'ประเภท': 'recordType',
  'รหัสผู้ติดต่อ': 'contactCode',
  'ชื่อธุรกิจ/ชื่อบุคคล': 'name',
  'ที่อยู่': 'address1',
  'ที่อยู่ 2': 'address2',
  'ที่อยู่ 3': 'address3',
  'รหัสไปรษณีย์': 'postalCode',
  'เลขผู้เสียภาษี': 'taxId',
  'รหัสสาขา': 'branchCode',
  'สำนักงาน/สาขา': 'branchName',
  'ชื่อผู้ติดต่อ': 'contactName',
  'อีเมล': 'email',
  'เบอร์มือถือ': 'mobile',
  'เครดิต (วัน)': 'creditDays',
  'เบอร์สำนักงาน': 'officePhone',
  'เบอร์โทรสาร': 'fax',
}

const RECORD_TYPE_TAG: Record<string, string> = {
  'ผู้จำหน่าย': 'Vendor',
  'ลูกค้า': 'Customer',
}

interface ParsedRow {
  recordType: string
  name: string
  address1: string
  address2: string
  address3: string
  postalCode: string
  taxId: string
  branchCode: string
  branchName: string
  contactName: string
  email: string
  mobile: string
  officePhone: string
  fax: string
  // Validated values for the Company's own tax_id/branch_code/postal_code
  // columns ('' when the file's value is missing or malformed — that raw
  // value then goes to notes instead, so nothing is lost and the API's
  // 5-digit checks can't reject the whole row).
  validTaxId: string
  validBranchCode: string
  validPostalCode: string
}

const fileName = ref('')
const error = ref('')
const parsedRows = ref<ParsedRow[]>([])
// Existing Company per normalized tax_id|branch_code key found on the
// server at preview time (null = looked up, none found).
const taxIdMatches = ref(new Map<string, Company | null>())
let latestParseId = 0
const preview = ref<{ totalRows: number, newCompanies: number, existingCompanies: number, newContacts: number, skipped: number } | null>(null)

const onUpdateOpen = (value: boolean) => {
  if (!value) {
    fileName.value = ''
    error.value = ''
    parsedRows.value = []
    taxIdMatches.value = new Map()
    preview.value = null
  }
  emit('update:open', value)
}

const cell = (row: unknown[], headerIndex: Record<string, number>, key: string) => {
  const index = headerIndex[key]
  if (index === undefined) return ''
  const value = row[index]
  return value === undefined || value === null ? '' : String(value).trim()
}

const HEAD_OFFICE_LABEL = 'สำนักงานใหญ่'

const taxFields = (row: unknown[], headerIndex: Record<string, number>) => {
  const taxId = normalizeTaxId(cell(row, headerIndex, 'taxId'))
  // Spreadsheets drop leading zeros from numeric-looking cells, so a head
  // office "00000" can arrive as "0"; FlowAccount also leaves the code
  // blank for a head office it only names.
  let branchCode = cell(row, headerIndex, 'branchCode')
  if (/^\d{1,5}$/.test(branchCode)) branchCode = branchCode.padStart(5, '0')
  else if (!branchCode && cell(row, headerIndex, 'branchName').includes(HEAD_OFFICE_LABEL)) branchCode = HEAD_OFFICE_BRANCH_CODE
  const postalCode = cell(row, headerIndex, 'postalCode')
  const validTaxId = isValidThaiTaxId(taxId) ? taxId : ''
  return {
    validTaxId,
    // A branch only means something alongside a tax ID.
    validBranchCode: validTaxId && isFiveDigitCode(branchCode) ? branchCode : '',
    validPostalCode: isFiveDigitCode(postalCode) ? postalCode : '',
  }
}

const joinAddress = (row: ParsedRow) => [row.address1, row.address2, row.address3].filter(Boolean).join(' ')

const taxIdKey = (row: ParsedRow) => `${row.validTaxId}|${row.validBranchCode}`
const companyKey = (row: ParsedRow) => row.validTaxId ? `tax:${taxIdKey(row)}` : `name:${row.name.trim().toLowerCase()}`

// Tax ID + branch identifies the buyer even when the name is spelled
// differently ("บจก. …" vs "บริษัท … จำกัด"), so it wins over the name match.
const findExistingCompany = (row: ParsedRow) =>
  (row.validTaxId ? taxIdMatches.value.get(taxIdKey(row)) : null) ?? companiesStore.findByName(row.name) ?? null

const lookupTaxIdMatches = async (rows: ParsedRow[]) => {
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
const backfillFor = (company: Company, row: ParsedRow) => {
  const changes: Partial<Company> = {}
  const address = joinAddress(row)
  if (!company.tax_id && row.validTaxId) changes.tax_id = row.validTaxId
  if (!company.branch_code && row.validBranchCode) changes.branch_code = row.validBranchCode
  if (!company.postal_code && row.validPostalCode) changes.postal_code = row.validPostalCode
  if (!company.address && address) changes.address = address
  return changes
}

const onFileChange = async (event: Event) => {
  error.value = ''
  preview.value = null
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
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' })

    // The FlowAccount export has a merged title row before the real header
    // row, so find the header row by content rather than assuming row 0.
    const headerRowIndex = rows.findIndex(row => row.some(c => String(c).trim() === 'ชื่อธุรกิจ/ชื่อบุคคล'))
    if (headerRowIndex === -1) {
      error.value = t('crm.components.importModal.errorNoHeader')
      return
    }

    const headerRow = rows[headerRowIndex]!
    const headerIndex: Record<string, number> = {}
    headerRow.forEach((label, index) => {
      const key = HEADER_MAP[String(label).trim()]
      if (key) headerIndex[key] = index
    })

    if (headerIndex.name === undefined) {
      error.value = t('crm.components.importModal.errorNoHeader')
      return
    }

    const dataRows = rows.slice(headerRowIndex + 1)
    const result: ParsedRow[] = []
    for (const row of dataRows) {
      const name = cell(row, headerIndex, 'name')
      if (!name) continue
      result.push({
        recordType: cell(row, headerIndex, 'recordType'),
        name,
        address1: cell(row, headerIndex, 'address1'),
        address2: cell(row, headerIndex, 'address2'),
        address3: cell(row, headerIndex, 'address3'),
        postalCode: cell(row, headerIndex, 'postalCode'),
        taxId: cell(row, headerIndex, 'taxId'),
        branchCode: cell(row, headerIndex, 'branchCode'),
        branchName: cell(row, headerIndex, 'branchName'),
        ...taxFields(row, headerIndex),
        contactName: cell(row, headerIndex, 'contactName'),
        email: cell(row, headerIndex, 'email'),
        mobile: cell(row, headerIndex, 'mobile'),
        officePhone: cell(row, headerIndex, 'officePhone'),
        fax: cell(row, headerIndex, 'fax'),
      })
    }

    if (result.length === 0) {
      error.value = t('crm.components.importModal.errorNoRows')
      return
    }

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
      skipped: dataRows.length - result.length,
    }
  } catch {
    error.value = t('crm.components.importModal.errorParseFailed')
  }
}

const buildNotes = (row: ParsedRow) => {
  const lines: string[] = []
  // Only what didn't land in a Company field of its own.
  if (row.postalCode && !row.validPostalCode) lines.push(`รหัสไปรษณีย์: ${row.postalCode}`)
  if (row.taxId && !row.validTaxId) lines.push(`เลขผู้เสียภาษี: ${row.taxId}`)
  if (row.branchName && !(row.validBranchCode === HEAD_OFFICE_BRANCH_CODE && row.branchName.includes(HEAD_OFFICE_LABEL))) {
    lines.push(`สำนักงาน/สาขา: ${row.branchName}${row.branchCode ? ` (${row.branchCode})` : ''}`)
  }
  if (row.officePhone) lines.push(`เบอร์สำนักงาน: ${row.officePhone}`)
  if (row.fax) lines.push(`เบอร์โทรสาร: ${row.fax}`)
  lines.push('นำเข้าจาก FlowAccount')
  return lines.join('\n')
}

// Re-entry guard for the sequential create loop below: without it, a double
// click on Import (or a click while a previous run is still going) starts a
// second loop that races the first — both see a company as not-yet-existing
// and both create it, leaving duplicates.
const importing = ref(false)

const onConfirm = async () => {
  if (importing.value) return
  importing.value = true
  let companiesCreated = 0
  let contactsCreated = 0

  try {
    for (const row of parsedRows.value) {
      const tag = RECORD_TYPE_TAG[row.recordType] || row.recordType

      let company = findExistingCompany(row)
      if (!company) {
        company = await companiesStore.add({
          name: row.name,
          industry: '',
          size: '',
          revenue_size: '',
          website: '',
          tags: tag ? [tag] : [],
          notes: buildNotes(row),
          status: 'active',
          legal_name: null,
          address: joinAddress(row) || null,
          tax_id: row.validTaxId || null,
          branch_code: row.validBranchCode || null,
          postal_code: row.validPostalCode || null,
          created_at: new Date(),
          updated_at: new Date(),
          last_activity_at: null,
        })
        companiesCreated += 1
      } else {
        const changes = backfillFor(company, row)
        if (Object.keys(changes).length > 0) {
          try {
            // Full-record PUT (the API overwrites every field): resend the
            // whole Company with only the blanks filled in.
            company = await companiesStore.update(company.id, { ...company, ...changes })
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
  onUpdateOpen(false)
}
</script>
