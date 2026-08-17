import global from './global/en'
import layout from './layout/en'
import adminActivityLog from './admin/activity-log/en'
import adminUsers from './admin/users/en'
import adminProducts from './admin/products/en'
import adminTrash from './admin/trash/en'
import adminPipelineConfig from './admin/pipeline-config/en'
import crmDashboard from './crm/dashboard/en'
import crmLeads from './crm/leads/en'
import crmDeals from './crm/deals/en'
import crmContacts from './crm/contacts/en'
import crmCompanies from './crm/companies/en'
import crmTags from './crm/tags/en'
import crmTasks from './crm/tasks/en'
import crmProjects from './crm/projects/en'
import crmComponents from './crm/components/en'
import crmReports from './crm/reports/en'
import crmContracts from './crm/contracts/en'

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
    trash: adminTrash,
    pipelineConfig: adminPipelineConfig,
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
    reports: crmReports,
    contracts: crmContracts,
  },
}
