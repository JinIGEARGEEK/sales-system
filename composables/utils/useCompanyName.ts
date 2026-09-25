// Converting a Prospect with no linked company creates a Company with an
// empty name (backend convert.go, by design) — rendered raw, that's a blank
// list row / blank link nobody can identify or click. Every place that shows
// a company name as its primary label runs it through this instead, getting
// a translated "(Unnamed company)" placeholder for a blank name.
export const useCompanyName = () => {
  const { t } = useI18n()
  const companiesStore = useCompaniesStore()

  const isUnnamed = (name?: string | null) => !name || !name.trim()

  const companyName = (name?: string | null) => (isUnnamed(name) ? t('global.unnamedCompany') : name!.trim())

  // A loaded Company's label by id; '-' for no id or a Company not loaded yet.
  const companyLabelById = (id: number | null | undefined) => {
    const company = id ? companiesStore.items.find(c => c.id === id) : undefined
    return company ? companyName(company.name) : '-'
  }

  return { companyName, isUnnamed, companyLabelById }
}
