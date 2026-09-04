export default {
  index: {
    pageTitle: 'Campaigns',
    heading: 'Campaigns',
    subheading: 'Reach out to past customers and new prospects to find sales opportunities.',
    startCampaign: 'Start a campaign',
    noCampaigns: 'No campaigns yet. Click "Start a campaign" above to get started.',
    convertedHint: 'Converted = targets that became new customers (won a Deal) since this campaign started.',
    type: {
      win_back: 'Win-Back',
      upsell: 'Upsell',
      new_channel: 'New Channel',
    },
    progress: {
      total: '{count} total',
      done: '{count} done',
      pending: '{count} pending',
      converted: '{count} converted',
    },
  },
  // Guided, Marketing-facing entry point (pages/crm/campaigns/new.vue) —
  // separate copy from crm.companies.index's staleDays*/hasWonDeal* keys,
  // which stay Sales-facing filter labels on the Companies list. See
  // FR-CRM-110/111's "Updated 2026-09-04" addendum in biz_spec/feature-spec.md.
  new: {
    pageTitle: 'Start a Campaign',
    heading: 'Start a Campaign',
    steps: {
      who: 'Who to contact',
      setup: 'Set up the follow-up',
      review: 'Review & confirm',
    },
    step1: {
      heading: 'Who do you want to contact?',
      entityTypeLabel: 'Target',
      entityTypeCompany: 'Companies',
      entityTypeLead: 'Leads',
      entityTypeContact: 'Contacts',
      staleDaysLabel: "Haven't heard from in:",
      staleDays60: '2 months',
      staleDays90: '3 months',
      staleDays120: '4+ months',
      hasWonDealOnly: 'Only companies who already bought from us before',
      searchPlaceholder: 'Search by name...',
      matchCount: '{count} match',
      matchCountLoading: 'Finding matches...',
      noMatches: 'No matches yet — try different filters.',
    },
    cancel: 'Cancel',
    createSuccess: '"{name}" campaign created with {count} follow-up tasks.',
    addSuccess: 'Added {count} follow-up tasks to "{name}".',
  },
}
