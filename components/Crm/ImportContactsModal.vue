<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.importModal.title') }}</h3>
    </template>
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.components.importModal.description') }}</p>

        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-light-gray-2)] p-6 text-center hover:bg-[var(--color-light-gray-1)]"
        >
          <UIcon name="material-symbols:upload-file-outline" class="size-8 text-[var(--color-gray)]" />
          <span class="text-sm font-medium">{{ fileName || t('crm.components.importModal.chooseFile') }}</span>
          <span class="text-xs text-[var(--color-gray)]">{{ t('crm.components.importModal.acceptedFormats') }}</span>
          <input type="file" accept=".csv,.xls,.xlsx" class="hidden" @change="onFileChange" >
        </label>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="material-symbols:error-outline"
          :title="error"
        />

        <div v-if="preview" class="flex flex-col gap-2 rounded-lg bg-[var(--color-light-gray-1)] p-3 text-sm">
          <p>{{ t('crm.components.importModal.previewSummary', { rows: preview.totalRows }) }}</p>
          <ul class="list-disc pl-5 text-[var(--color-gray)]">
            <li>{{ t('crm.components.importModal.previewCompanies', { count: preview.newCompanies, existing: preview.existingCompanies }) }}</li>
            <li>{{ t('crm.components.importModal.previewContacts', { count: preview.newContacts }) }}</li>
            <li v-if="preview.skipped > 0">{{ t('crm.components.importModal.previewSkipped', { count: preview.skipped }) }}</li>
          </ul>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.importModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary
          :label="t('crm.components.importModal.confirmImport')"
          :disabled="!preview || preview.newCompanies + preview.newContacts === 0"
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
}

const fileName = ref('')
const error = ref('')
const parsedRows = ref<ParsedRow[]>([])
const preview = ref<{ totalRows: number, newCompanies: number, existingCompanies: number, newContacts: number, skipped: number } | null>(null)

const onUpdateOpen = (value: boolean) => {
  if (!value) {
    fileName.value = ''
    error.value = ''
    parsedRows.value = []
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
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' })

    // The FlowAccount export has a merged title row before the real header
    // row, so find the header row by content rather than assuming row 0.
    const headerRowIndex = rows.findIndex(row => row.some(c => String(c).trim() === 'ชื่อธุรกิจ/ชื่อบุคคล'))
    if (headerRowIndex === -1) {
      error.value = t('crm.components.importModal.errorNoHeader')
      return
    }

    const headerRow = rows[headerRowIndex]
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

    parsedRows.value = result

    let newCompanies = 0
    let existingCompanies = 0
    let newContacts = 0
    for (const row of result) {
      if (companiesStore.findByName(row.name)) {
        existingCompanies += 1
      } else {
        newCompanies += 1
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
  const address = [row.address1, row.address2, row.address3].filter(Boolean).join(' ')
  if (address) lines.push(`ที่อยู่: ${address}`)
  if (row.postalCode) lines.push(`รหัสไปรษณีย์: ${row.postalCode}`)
  if (row.taxId) lines.push(`เลขผู้เสียภาษี: ${row.taxId}`)
  if (row.branchName) lines.push(`สำนักงาน/สาขา: ${row.branchName}${row.branchCode ? ` (${row.branchCode})` : ''}`)
  if (row.officePhone) lines.push(`เบอร์สำนักงาน: ${row.officePhone}`)
  if (row.fax) lines.push(`เบอร์โทรสาร: ${row.fax}`)
  lines.push('นำเข้าจาก FlowAccount')
  return lines.join('\n')
}

const onConfirm = async () => {
  let companiesCreated = 0
  let contactsCreated = 0

  try {
    for (const row of parsedRows.value) {
      const tag = RECORD_TYPE_TAG[row.recordType] || row.recordType

      let company = companiesStore.findByName(row.name)
      if (!company) {
        company = await companiesStore.add({
          name: row.name,
          industry: '',
          size: '',
          website: '',
          tags: tag ? [tag] : [],
          notes: buildNotes(row),
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          last_activity_at: null,
        })
        companiesCreated += 1
      } else if (tag) {
        companiesStore.addTag(company.id, tag)
      }

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
  }

  emit('imported', { companies: companiesCreated, contacts: contactsCreated })
  onUpdateOpen(false)
}
</script>
