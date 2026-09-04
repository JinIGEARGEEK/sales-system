export default {
  index: {
    pageTitle: 'Campaigns',
    heading: 'Campaigns',
    subheading: 'Reach out to past customers to find new sales opportunities.',
    startCampaign: 'Start a win-back campaign',
    noCampaigns: 'No campaigns yet. Click "Start a win-back campaign" above to reach out to past customers.',
    convertedHint: 'Converted = companies that became new customers again since this campaign started.',
    type: {
      win_back: 'Win-Back',
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
    pageTitle: 'Start a Win-Back Campaign',
    heading: 'Start a Win-Back Campaign',
    steps: {
      who: 'Who to contact',
      setup: 'Set up the follow-up',
      review: 'Review & confirm',
    },
    step1: {
      heading: 'Who do you want to contact?',
      staleDaysLabel: "Haven't heard from in:",
      staleDays60: '2 months',
      staleDays90: '3 months',
      staleDays120: '4+ months',
      hasWonDealOnly: 'Only companies who already bought from us before',
      matchCount: '{count} companies match',
      matchCountLoading: 'Finding matching companies...',
      noMatches: 'No companies match yet — try a wider time range.',
    },
    cancel: 'Cancel',
    createSuccess: '"{name}" campaign created with {count} follow-up tasks.',
  },
}
