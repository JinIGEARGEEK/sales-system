import global from './global/en'
import layout from './layout/en'
import adminDashboard from './admin/dashboard/en'
import adminUsers from './admin/users/en'
import crmDashboard from './crm/dashboard/en'
import crmLeads from './crm/leads/en'
import crmDeals from './crm/deals/en'
import crmContacts from './crm/contacts/en'
import crmCompanies from './crm/companies/en'
import crmTags from './crm/tags/en'
import crmComponents from './crm/components/en'

const components = {
}

export default {
  global,
  components,
  layout,
  admin: {
    dashboard: adminDashboard,
    users: adminUsers,
  },
  crm: {
    dashboard: crmDashboard,
    leads: crmLeads,
    deals: crmDeals,
    contacts: crmContacts,
    companies: crmCompanies,
    tags: crmTags,
    components: crmComponents,
  },
}
