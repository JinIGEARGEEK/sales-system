// GET /reports/lead-source-conversion — one row per Lead source.
interface LeadSourceConversionRow {
  source: LeadSource
  total: number
  qualified: number
  conversion_rate: number
}

// GET /reports/customers-by-product-status — one row per Company/Product link.
interface CustomerByProductStatusRow {
  company_id: number
  company_name: string
  product_id: number
  status: CustomerProductStatus
  start_date: string
}
