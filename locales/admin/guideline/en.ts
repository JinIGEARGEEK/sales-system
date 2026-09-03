export default {
  title: 'Guideline',
  subtitle: 'How each role uses this system, from lead intake through renewal and upsell.',
  legendHint: 'Highlighted words are the record types you\'ll create or update. The chip above each step shows where to find it in the sidebar.',
  searchPlaceholder: 'Search guideline, e.g. "renewal", "payment", "lead"...',
  clearSearch: 'Clear search',
  noResultsTitle: 'No matching guideline found',
  roleTabs: {
    salesRep: 'Sales Rep',
    salesManager: 'Sales Manager',
    admin: 'Admin',
    marketing: 'Marketing',
    production: 'Production',
  },
  topics: {
    leadToDeal: {
      title: 'Lead intake → deal hand-off',
      description: 'Key in a new Lead as soon as it arrives, then hand it off to the sales team to work as a Deal.',
      flow: ['Lead', 'Deal', 'Won'],
      steps: [
        {
          nav: 'leads',
          text: 'Create the Lead with source, company, and contact details filled in — this is what Sales Managers use to judge lead quality later. Tag which Project or Product they\'re interested in via Business Unit if it\'s already known; it carries forward automatically once the Lead becomes a Deal.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'leads',
          text: 'Qualify the Lead using the Lead Score; once it is sales-ready, convert it into a Deal so it enters the Pipeline.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'Assign the Deal to the owning Sales Rep and set the Pipeline Stage — this is the official hand-off point.',
          restriction: 'Sales Manager, Admin reassign; Sales Rep works assigned deals',
        },
        {
          nav: 'deals',
          text: 'Keep the Deal\'s Stage, value, and next Activity up to date as it moves through the Pipeline toward Won/Lost.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    subscriptionFollowup: {
      title: 'Subscription follow-up (monthly / yearly)',
      description: 'Track recurring product Subscriptions and follow up before they lapse.',
      flow: ['Subscription', 'Reminder Task', 'Renewed'],
      steps: [
        {
          nav: 'deals',
          text: 'Record the product and billing cycle (monthly or yearly) on the customer\'s Deal or Project record.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'tasks',
          text: 'Create a Task to schedule a follow-up Activity ahead of each renewal date so it never gets missed.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'Check in with the customer before renewal to confirm usage and satisfaction, and log the outcome as an Activity on the Deal.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'If the Subscription is renewed, update the record with the new cycle dates; if not, capture the reason for reporting.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    projectMilestones: {
      title: 'Project delivery & payment milestones',
      description: 'Manage delivery work and the payment Milestones tied to it.',
      flow: ['Project', 'Milestone', 'Payment'],
      steps: [
        {
          nav: 'projects',
          text: 'Open a Project against the won Deal and break the work into delivery Milestones.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'projects',
          text: 'Update Milestone status as work progresses.',
          restriction: 'Sales Rep, Sales Manager, Admin, and Production — Production may only update status/reference fields',
        },
        {
          nav: 'deals',
          text: 'Open the Deal\'s Contract, Quote, and Payment tabs to raise the agreed payment schedule, then track each Payment Milestone as it is invoiced and collected.',
          restriction: 'Sales Rep, Sales Manager, Admin — not available to Production',
        },
        {
          nav: 'projects',
          text: 'Flag any Milestone that is overdue on delivery or payment so it surfaces in reporting.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    loyaltyUpsell: {
      title: 'Customer loyalty & upsell',
      description: 'Turn existing customers into repeat business.',
      flow: ['Company History', 'Touchpoint', 'Upsell Deal'],
      steps: [
        {
          nav: 'companies',
          text: 'Review a Company or Contact\'s Deal and Subscription history to spot renewal or expansion opportunities.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'contacts',
          text: 'Log loyalty touchpoints (check-ins, satisfaction notes) as Activities so the relationship history stays visible to the whole team.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'When an upsell opportunity appears, create a new Deal linked to the existing Company/Contact rather than starting from a cold Lead.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'tags',
          text: 'Tag high-value or long-tenure customers so Sales Managers can prioritize account-growth efforts.',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    prospectIntake: {
      title: 'Prospect intake → Lead hand-off',
      description: 'Marketing\'s own pre-Lead funnel — work a new Prospect until it\'s sales-ready, then convert it into a Lead so Sales picks up exactly where you left off.',
      flow: ['Prospect', 'Lead'],
      steps: [
        {
          nav: 'prospects',
          text: 'Create the Prospect with source, company, and contact details filled in. Tag which Project or Product they\'re interested in via Business Unit if it\'s already known — this carries forward automatically once it becomes a Lead.',
          restriction: 'Marketing, Sales Manager, Admin',
        },
        {
          nav: 'prospects',
          text: 'Work the Prospect through New → Engaging → Nurturing status, logging follow-up Tasks along the way so nothing falls through the cracks.',
          restriction: 'Marketing, Sales Manager, Admin',
        },
        {
          nav: 'prospects',
          text: 'Once it\'s ready for Sales, use Convert to Lead — no specific status is required first, just that it isn\'t Disqualified. This creates the Lead (and Company/Contact if new) and carries over Attachments automatically.',
          restriction: 'Marketing, Sales Manager, Admin',
        },
        {
          nav: 'tasks',
          text: 'Track your own follow-up Tasks across every Prospect from one place on the all-Tasks page, not just one Prospect at a time.',
          restriction: 'Marketing, Sales Manager, Admin',
        },
      ],
    },
  },
  roleFocus: {
    salesRep: 'Own the Leads, Deals, Subscriptions, and Projects assigned to you — this is your day-to-day workflow.',
    salesManager: 'Everything Sales Reps do, plus team-wide Pipeline visibility, reassigning Deals, and reviewing renewal/upsell coverage.',
    admin: 'Full visibility into every workflow, plus configuring Pipeline stages, fields, and product catalog that the workflows below depend on.',
    marketing: 'Own the pre-Lead Prospect funnel — work Prospects through to sales-ready, then convert to a Lead. No access to Leads/Deals/Quotes/Contracts/Payments.',
    production: 'Only the delivery-Milestone step below — update status and reference on the Projects assigned to you.',
  },
}
