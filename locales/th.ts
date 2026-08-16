import global from './global/th'
import layout from './layout/th'
import adminActivityLog from './admin/activity-log/th'
import adminUsers from './admin/users/th'
import adminProducts from './admin/products/th'
import crmDashboard from './crm/dashboard/th'
import crmLeads from './crm/leads/th'
import crmDeals from './crm/deals/th'
import crmContacts from './crm/contacts/th'
import crmCompanies from './crm/companies/th'
import crmTags from './crm/tags/th'
import crmTasks from './crm/tasks/th'
import crmProjects from './crm/projects/th'
import crmComponents from './crm/components/th'

const components = {

}

export default {
  global,
  components,
  layout,
  admin: {
    activityLog: adminActivityLog,
    users: adminUsers,
    products: adminProducts,
  },
  crm: {
    dashboard: crmDashboard,
    leads: crmLeads,
    deals: crmDeals,
    contacts: crmContacts,
    companies: crmCompanies,
    tags: crmTags,
    tasks: crmTasks,
    projects: crmProjects,
    components: crmComponents,
  },
}
