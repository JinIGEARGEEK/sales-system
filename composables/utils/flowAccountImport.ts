// Parsing for CrmImportContactsModal: a FlowAccount "สมุดรายชื่อ" (address
// book) export, already read into rows of cells (XLSX sheet_to_json with
// `header: 1`). Pure — no store or API calls — so the dialog keeps only the
// lookups and the create loop.

// Column headers matched by exact text rather than position — tolerant of
// columns being reordered or extra ones being present, since this is a fixed
// third-party export format we don't control.
const HEADER_MAP: Record<string, keyof FlowAccountCells> = {
  'ประเภท': 'recordType',
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
  'เบอร์สำนักงาน': 'officePhone',
  'เบอร์โทรสาร': 'fax',
}
const CELL_KEYS = Object.values(HEADER_MAP)
const NAME_HEADER = 'ชื่อธุรกิจ/ชื่อบุคคล'
const HEAD_OFFICE_LABEL = 'สำนักงานใหญ่'

// The record type column → the tag the imported Company gets.
const RECORD_TYPE_TAG: Record<string, string> = {
  'ผู้จำหน่าย': 'Vendor',
  'ลูกค้า': 'Customer',
}

// The file's own values, trimmed ('' when the column is missing).
interface FlowAccountCells {
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

export interface FlowAccountRow extends FlowAccountCells {
  // 1-based spreadsheet row, for the per-row error list after an import.
  sheetRow: number
  // Validated values for the Company's own tax_id/branch_code/postal_code
  // columns ('' when the file's value is missing or malformed — that raw
  // value then goes to notes instead, so nothing is lost and the API's
  // 5-digit checks can't reject the whole row).
  validTaxId: string
  validBranchCode: string
  validPostalCode: string
}

export type FlowAccountParseResult =
  | { ok: true, rows: FlowAccountRow[], skipped: number }
  // noHeader: no FlowAccount header row; noRows: a header but no named rows.
  | { ok: false, reason: 'noHeader' | 'noRows' }

const validTaxFields = (cells: FlowAccountCells) => {
  const taxId = normalizeTaxId(cells.taxId)
  // Spreadsheets drop leading zeros from numeric-looking cells, so a head
  // office "00000" can arrive as "0"; FlowAccount also leaves the code
  // blank for a head office it only names.
  let branchCode = cells.branchCode
  if (/^\d{1,5}$/.test(branchCode)) branchCode = branchCode.padStart(5, '0')
  else if (!branchCode && cells.branchName.includes(HEAD_OFFICE_LABEL)) branchCode = HEAD_OFFICE_BRANCH_CODE
  const validTaxId = isValidThaiTaxId(taxId) ? taxId : ''
  return {
    validTaxId,
    // A branch only means something alongside a tax ID.
    validBranchCode: validTaxId && isFiveDigitCode(branchCode) ? branchCode : '',
    validPostalCode: isFiveDigitCode(cells.postalCode) ? cells.postalCode : '',
  }
}

export function parseFlowAccountRows(rows: unknown[][]): FlowAccountParseResult {
  // The export has a merged title row before the real header row, so find
  // the header row by content rather than assuming row 0.
  const headerRowIndex = rows.findIndex(row => row.some(c => String(c).trim() === NAME_HEADER))
  if (headerRowIndex === -1) return { ok: false, reason: 'noHeader' }

  const headerIndex: Partial<Record<keyof FlowAccountCells, number>> = {}
  rows[headerRowIndex]!.forEach((label, index) => {
    const key = HEADER_MAP[String(label).trim()]
    if (key) headerIndex[key] = index
  })

  const dataRows = rows.slice(headerRowIndex + 1)
  const parsed: FlowAccountRow[] = []
  for (const [offset, row] of dataRows.entries()) {
    const cell = (key: keyof FlowAccountCells) => {
      const index = headerIndex[key]
      const value = index === undefined ? undefined : row[index]
      return value === undefined || value === null ? '' : String(value).trim()
    }
    const cells = {} as FlowAccountCells
    for (const key of CELL_KEYS) cells[key] = cell(key)
    if (!cells.name) continue
    parsed.push({ sheetRow: headerRowIndex + 2 + offset, ...cells, ...validTaxFields(cells) })
  }

  if (parsed.length === 0) return { ok: false, reason: 'noRows' }
  return { ok: true, rows: parsed, skipped: dataRows.length - parsed.length }
}

export const flowAccountAddress = (row: FlowAccountRow) => [row.address1, row.address2, row.address3].filter(Boolean).join(' ')

export const flowAccountTag = (row: FlowAccountRow) => RECORD_TYPE_TAG[row.recordType] || row.recordType

// The new Company's notes: only what didn't land in a Company field of its own.
export const flowAccountNotes = (row: FlowAccountRow) => {
  const lines: string[] = []
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
