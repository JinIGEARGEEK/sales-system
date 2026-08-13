import global from './global/th'
import layout from './layout/th'
import adminDashboard from './admin/dashboard/th'
import adminUsers from './admin/users/th'
import crmDashboard from './crm/dashboard/th'
import crmLeads from './crm/leads/th'
import crmDeals from './crm/deals/th'
import crmContacts from './crm/contacts/th'
import crmCompanies from './crm/companies/th'
import crmTags from './crm/tags/th'
import crmComponents from './crm/components/th'

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
