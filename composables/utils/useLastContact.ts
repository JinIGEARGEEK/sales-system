import { useI18n } from 'vue-i18n'

const CONTACT_STALE_TIER_DAYS = {
  tier1: 60,
  tier2: 90,
  tier3: 120,
} as const

type ContactTier = 'fresh' | 'tier1' | 'tier2' | 'tier3'

const TIER_COLOR: Record<ContactTier, string> = {
  fresh: 'success',
  tier1: 'warning',
  tier2: 'error',
  tier3: 'error',
}

export const useLastContact = () => {
  const { t } = useI18n()

  const daysSinceContact = (date: Date | null): number | null => {
    if (!date) return null
    return Math.floor((Date.now() - date.getTime()) / 86400000)
  }

  const contactTier = (days: number | null): ContactTier => {
    if (days === null || days >= CONTACT_STALE_TIER_DAYS.tier3) return 'tier3'
    if (days >= CONTACT_STALE_TIER_DAYS.tier2) return 'tier2'
    if (days >= CONTACT_STALE_TIER_DAYS.tier1) return 'tier1'
    return 'fresh'
  }

  const lastContactLabel = (days: number | null): string => {
    if (days === null) return t('crm.components.lastContact.never')
    if (days === 0) return t('crm.components.lastContact.today')
    return t('crm.components.lastContact.daysAgo', { days })
  }

  const lastContactInfo = (date: Date | null) => {
    const days = daysSinceContact(date)
    const tier = contactTier(days)
    return {
      days,
      tier,
      isStale: tier !== 'fresh',
      label: lastContactLabel(days),
      color: TIER_COLOR[tier],
    }
  }

  return {
    lastContactInfo,
    contactTier,
    CONTACT_STALE_TIER_DAYS,
  }
}
