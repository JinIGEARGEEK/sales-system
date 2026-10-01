import { describe, it, expect } from 'vitest'
import { flowAccountAddress, flowAccountNotes, flowAccountTag, parseFlowAccountRows } from '~/composables/utils/flowAccountImport'

// A FlowAccount address-book export: a merged title row, then the header row
// (columns in any order, extras ignored), then one row per contact.
const HEADER = ['ประเภท', 'รหัสผู้ติดต่อ', 'ชื่อธุรกิจ/ชื่อบุคคล', 'ที่อยู่', 'ที่อยู่ 2', 'รหัสไปรษณีย์', 'เลขผู้เสียภาษี', 'รหัสสาขา', 'สำนักงาน/สาขา', 'ชื่อผู้ติดต่อ', 'อีเมล', 'เบอร์มือถือ', 'เบอร์สำนักงาน']
const sheet = (...rows: unknown[][]) => [['สมุดรายชื่อ'], HEADER, ...rows]

describe('parseFlowAccountRows', () => {
  it('finds the header by content and reads each named row with its sheet row number', () => {
    const result = parseFlowAccountRows(sheet(
      ['ลูกค้า', 'C001', ' Acme ', '1 Road', 'Bangkok', '10110', '0-1055-12345-67-1', '0', 'สำนักงานใหญ่', 'Ann', 'ann@acme.co', '0812345678', '021234567'],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.skipped).toBe(1)
    expect(result.rows).toHaveLength(1)
    const row = result.rows[0]!
    expect(row).toMatchObject({ sheetRow: 3, name: 'Acme', contactName: 'Ann', email: 'ann@acme.co', mobile: '0812345678', fax: '' })
    // Tax ID normalized, "0" padded back to the head-office code, postal code kept.
    expect(row).toMatchObject({ validTaxId: '0105512345671', validBranchCode: '00000', validPostalCode: '10110' })
    expect(flowAccountAddress(row)).toBe('1 Road Bangkok')
    expect(flowAccountTag(row)).toBe('Customer')
  })

  it('keeps malformed tax values out of the Company fields and in the notes instead', () => {
    const result = parseFlowAccountRows(sheet(['ผู้จำหน่าย', '', 'Beta', '', '', '1011', '12345', '7', 'สาขาย่อย', '', '', '', '021234567']))
    if (!result.ok) throw new Error('expected rows')
    const row = result.rows[0]!

    expect(row).toMatchObject({ validTaxId: '', validBranchCode: '', validPostalCode: '' })
    expect(flowAccountTag(row)).toBe('Vendor')
    expect(flowAccountNotes(row).split('\n')).toEqual([
      'รหัสไปรษณีย์: 1011',
      'เลขผู้เสียภาษี: 12345',
      'สำนักงาน/สาขา: สาขาย่อย (7)',
      'เบอร์สำนักงาน: 021234567',
      'นำเข้าจาก FlowAccount',
    ])
  })

  it('reports a file without the FlowAccount header, or without any named row', () => {
    expect(parseFlowAccountRows([['Name', 'Email'], ['Acme', 'a@b.c']])).toEqual({ ok: false, reason: 'noHeader' })
    expect(parseFlowAccountRows(sheet(['ลูกค้า', '', '', '', '', '', '', '', '', 'Ann']))).toEqual({ ok: false, reason: 'noRows' })
  })
})
