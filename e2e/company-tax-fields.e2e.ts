import { expect, test } from '@playwright/test'
import { ADMIN, json, mockApi, signIn } from './support'

// Company Tax ID / Branch Code / Postal Code (CrmCompanyTaxFields): tax ID
// check-digit validation, the head-office label and autofill, the duplicate
// warning (exact tax_id + branch_code lookup), and the detail save sending
// the whole record (a full PUT) with the tax ID stored as digits only.
const VALID_TAX_ID = '0105512345671'
const COMPANY = {
  id: 1, name: 'Acme Corp', industry: 'Software', size: '', revenue_size: '', website: 'https://acme.test',
  tags: ['Tier 1'], notes: 'Key account', status: 'active', legal_name: 'Acme Corp Co., Ltd.', address: '1 Silom Rd',
  tax_id: null, branch_code: null, postal_code: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', last_activity_at: null,
}
const OTHER = { ...COMPANY, id: 2, name: 'Acme Holdings', tax_id: VALID_TAX_ID, branch_code: '00000' }

test.describe('Company tax fields', () => {
  let puts: Array<Record<string, unknown>>

  test.beforeEach(async ({ page }) => {
    puts = []
    await signIn(page)
    await mockApi(page, {
      'GET /auth/me': route => json(route, ADMIN),
      'GET /companies/1': route => json(route, COMPANY),
      'GET /companies': (route, url) => json(route, url.searchParams.get('tax_id') === VALID_TAX_ID ? [OTHER] : []),
      'PUT /companies/1': async (route) => {
        const body = route.request().postDataJSON()
        puts.push(body)
        await json(route, { ...COMPANY, ...body })
      },
    })
  })

  test('detail: rejects a bad check digit, warns on a duplicate, saves the full record', async ({ page }) => {
    await page.goto('/crm/companies/1')
    const taxId = page.getByLabel('Tax ID')
    await expect(page.getByLabel('Company Name')).toHaveValue('Acme Corp')

    await taxId.fill('0105512345678')
    await page.getByTestId('company-save').click()
    await expect(page.getByText('Tax ID must be a valid 13-digit number')).toBeVisible()
    expect(puts).toHaveLength(0)

    await taxId.fill('0-1055-12345-67-1')
    await page.getByLabel('Branch Code').fill('00000')
    await expect(page.getByTestId('company-branch-label')).toHaveText('Head office')
    const warning = page.getByTestId('company-tax-id-duplicate')
    await expect(warning).toContainText('A company with this Tax ID and branch already exists')
    await expect(warning.getByRole('link', { name: 'Acme Holdings' })).toHaveAttribute('href', '/crm/companies/2')

    await page.getByLabel('Postal Code').fill('10500')
    await page.getByTestId('company-save').click()
    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0]).toMatchObject({
      name: 'Acme Corp', industry: 'Software', website: 'https://acme.test', tags: ['Tier 1'], notes: 'Key account',
      legal_name: 'Acme Corp Co., Ltd.', address: '1 Silom Rd',
      tax_id: VALID_TAX_ID, branch_code: '00000', postal_code: '10500',
    })
  })

  test('create: a valid tax ID fills the branch in as head office', async ({ page }) => {
    await page.goto('/crm/companies/create')
    const branch = page.getByLabel('Branch Code')
    await expect(branch).toHaveValue('')
    await page.getByLabel('Tax ID').fill('0107537000017')
    await expect(branch).toHaveValue('00000')
    await expect(page.getByTestId('company-branch-label')).toHaveText('Head office')
    await expect(page.getByTestId('company-tax-id-duplicate')).toHaveCount(0)
  })
})
