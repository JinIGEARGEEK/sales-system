import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// FlowAccount address-book import (CrmImportContactsModal): tax ID, branch,
// postal code and address go into the Company's own fields (not notes); an
// existing Company is matched by tax ID + branch even under another name and
// only has its blanks filled in, through a full-record PUT.
const EXISTING = {
  id: 5, name: 'Acme', industry: 'Software', size: '', revenue_size: '', website: '', tags: [], notes: 'VIP',
  status: 'active', legal_name: null, address: null, tax_id: '0105512345671', branch_code: '00000', postal_code: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', last_activity_at: null,
}

const CSV = [
  'สมุดรายชื่อ',
  'ประเภท,ชื่อธุรกิจ/ชื่อบุคคล,ที่อยู่,รหัสไปรษณีย์,เลขผู้เสียภาษี,รหัสสาขา,สำนักงาน/สาขา,ชื่อผู้ติดต่อ,อีเมล',
  'ลูกค้า,บริษัท แอคมี จำกัด,1 Silom Rd,10500,0-1055-12345-67-1,0,สำนักงานใหญ่,,',
  'ลูกค้า,Beta Co,9 Rama 4,1050,0107537000017,,สำนักงานใหญ่,Somchai,somchai@beta.test',
].join('\n') // BOM added below: SheetJS reads a BOM-less CSV as Latin-1

test('imports tax fields into Company columns and matches by tax ID', async ({ page }) => {
  const posts: Array<Record<string, unknown>> = []
  const puts: Array<Record<string, unknown>> = []
  await signIn(page)
  await mockApi(page, {
    'GET /auth/me': route => json(route, ADMIN),
    'GET /companies': (route, url) => json(route, url.searchParams.get('tax_id') === EXISTING.tax_id && url.searchParams.get('branch_code') === '00000' ? [EXISTING] : []),
    'POST /companies': async (route) => {
      const body = route.request().postDataJSON()
      posts.push(body)
      await json(route, { ...body, id: 6 })
    },
    'PUT /companies/5': async (route) => {
      const body = route.request().postDataJSON()
      puts.push(body)
      await json(route, { ...EXISTING, ...body })
    },
    'POST /contacts': route => json(route, { id: 1, company_id: 6, name: 'Somchai', tags: [], created_at: '2026-01-01' }),
  })
  await page.goto('/crm/companies')
  await page.getByRole('button', { name: 'Import' }).click()
  await page.locator('input[type=file]').setInputFiles({ name: 'contacts.csv', mimeType: 'text/csv', buffer: Buffer.from(`\uFEFF${CSV}`) })
  await expect(page.getByText(/1 new companies to create \(1 already exist/)).toBeVisible()
  await page.getByTestId('import-contacts-confirm').click()

  await expect.poll(() => posts.length).toBe(1)
  expect(posts[0]).toMatchObject({
    name: 'Beta Co', address: '9 Rama 4', tax_id: '0107537000017', branch_code: '00000', postal_code: null,
  })
  // The malformed postal code is kept in notes; the mapped values aren't.
  expect(posts[0]!.notes).toContain('รหัสไปรษณีย์: 1050')
  expect(posts[0]!.notes).not.toContain('เลขผู้เสียภาษี')
  expect(posts[0]!.notes).not.toContain('ที่อยู่')

  expect(puts).toHaveLength(1)
  expect(puts[0]).toMatchObject({ name: 'Acme', industry: 'Software', notes: 'VIP', tax_id: EXISTING.tax_id, branch_code: '00000', postal_code: '10500', address: '1 Silom Rd' })
})
