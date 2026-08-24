<template>
  <div ref="rootRef" class="relative">
    <div class="global-search-glow relative overflow-hidden rounded-full">
      <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/20 via-white/5 to-transparent" />
      <UInput
        v-model="query"
        size="md"
        icon="material-symbols:search"
        :placeholder="t('crm.components.globalSearch.placeholder')"
        class="w-full"
        :ui="{
          base: 'rounded-full bg-white/10 backdrop-blur-md text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all placeholder:text-white/55 hover:bg-white/15 focus-visible:bg-white/15 py-1.5',
          leadingIcon: 'text-yellow-400',
        }"
        @focus="open = true"
        @keydown.escape="open = false"
      />
    </div>

    <div
      v-if="open && query.trim().length >= MIN_QUERY_LENGTH"
      class="absolute z-30 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-white/60 bg-white/95 shadow-xl backdrop-blur-2xl"
    >
      <div v-if="totalResults === 0" class="px-4 py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.components.globalSearch.noResults') }}
      </div>
      <template v-else>
        <div v-for="group in resultGroups" v-show="group.items.length > 0" :key="group.key" class="border-b border-white/50 last:border-none">
          <p class="px-4 pt-3 pb-1 text-xs font-medium text-[var(--color-gray)]">{{ group.label }}</p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="global-search-result flex items-center justify-between gap-3 px-4 py-2 text-sm"
            @click="onSelect"
          >
            <span class="truncate">{{ item.label }}</span>
            <span class="shrink-0 text-xs text-[var(--color-gray)]">{{ item.sublabel }}</span>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

const { t } = useI18n()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const dealsStore = useDealsStore()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const leadsStore = useLeadsStore()

// Deals/Companies/Contacts/Leads aren't a primary destination for Production
// (same SALES_PIPELINE_ROLES exclusion as layouts/default.vue's nav) — this
// search bar is the one place that restriction was previously not mirrored,
// so a Production user could still jump straight into a Deal/Company/Contact
// via search even though those links are hidden from their sidebar.
const canSearchSalesPipeline = computed(() => hasRole(...SALES_PIPELINE_ROLES))

const RESULT_LIMIT = 5
const MIN_QUERY_LENGTH = 2

const query = ref('')
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

// All four groups search the server live as the rep types (useDebouncedSearch)
// instead of filtering a preloaded-but-capped store cache — fetchAll() is
// capped at 200 rows, newest-first, per entity (see stores/companies.ts's
// fetchAll doc for the full explanation), so an older Deal/Company/Contact/
// Lead would otherwise never surface here at all, no matter how exactly its
// name was typed. This also means the Leads group properly matches by
// Company name again (GET /leads?search= joins to companies server-side),
// which a purely client-side filter here never could reliably do anyway.
const shouldSearch = (term: string) => term.trim().length >= MIN_QUERY_LENGTH && canSearchSalesPipeline.value

const dealSearch = useDebouncedSearch(async (term: string) => {
  const { items } = await dealsStore.fetchList({ search: term, per_page: RESULT_LIMIT })
  return items
}, { shouldSearch })

const companySearch = useDebouncedSearch(async (term: string) => {
  const { items } = await companiesStore.fetchList({ search: term, per_page: RESULT_LIMIT })
  return items
}, { shouldSearch })

const contactSearch = useDebouncedSearch(async (term: string) => {
  const { items } = await contactsStore.fetchList({ search: term, per_page: RESULT_LIMIT })
  return items
}, { shouldSearch })

const leadSearch = useDebouncedSearch(async (term: string) => {
  const { items } = await leadsStore.fetchList({ search: term, per_page: RESULT_LIMIT })
  return items
}, { shouldSearch })

// One input drives all four independent debounced searches.
watch(query, (value) => {
  dealSearch.term.value = value
  companySearch.term.value = value
  contactSearch.term.value = value
  leadSearch.term.value = value
})

// The Leads group's sublabel needs each visible lead's Company name —
// companiesStore.items isn't broadly preloaded anymore, so ensure each
// result's Company is actually loaded rather than silently showing "-" for
// one that happens to be older/uncached.
watch(leadSearch.results, (visibleLeads) => {
  for (const lead of visibleLeads) {
    if (lead.company_id && !companiesStore.items.some(c => c.id === lead.company_id)) {
      companiesStore.fetchOne(lead.company_id).catch(notifyApiError)
    }
  }
})

const resultGroups = computed(() => {
  if (query.value.trim().length < MIN_QUERY_LENGTH || !canSearchSalesPipeline.value) return []

  return [
    {
      key: 'deals',
      label: t('crm.components.globalSearch.deals'),
      items: dealSearch.results.value.map(deal => ({ path: `/crm/deals/${deal.id}`, label: deal.title, sublabel: deal.stage })),
    },
    {
      key: 'companies',
      label: t('crm.components.globalSearch.companies'),
      items: companySearch.results.value.map(company => ({ path: `/crm/companies/${company.id}`, label: company.name, sublabel: company.industry })),
    },
    {
      key: 'contacts',
      label: t('crm.components.globalSearch.contacts'),
      items: contactSearch.results.value.map(contact => ({ path: `/crm/contacts/${contact.id}`, label: contact.name, sublabel: contact.role_title })),
    },
    {
      key: 'leads',
      label: t('crm.components.globalSearch.leads'),
      items: leadSearch.results.value.map(lead => ({ path: `/crm/leads/${lead.id}`, label: lead.name, sublabel: companiesStore.nameById(lead.company_id) })),
    },
  ]
})

const totalResults = computed(() => resultGroups.value.reduce((sum, group) => sum + group.items.length, 0))

const onSelect = () => {
  query.value = ''
  open.value = false
}

const onClickOutside = (event: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
/*
 * Same yellow-to-blue gradient ring as pages/admin/guideline.vue's search
 * bar (.guideline-search-card) and the sidebar nav-link treatment in
 * layouts/default.vue — drawn via a mask-clipped ::before since border-color
 * can't take a gradient. Always on here (this bar has no "stuck"/floating
 * state to gate it behind, unlike guideline's), with the glow intensifying
 * on focus to match guideline's own focus/stuck emphasis.
 *
 * `overflow-hidden` on this element (for the corner-highlight overlay div
 * right below it in the template) doesn't clip this ::before — it's inset:0
 * with a 1px padding, entirely within bounds already.
 */
.global-search-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(96, 165, 250, 0.9));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.global-search-glow:has(input:focus-visible) {
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.25), 0 0 18px rgba(96, 165, 250, 0.25);
}

.global-search-result {
  position: relative;
  color: var(--color-black);
  transition: color 0.2s ease, background-color 0.2s ease;
}

.global-search-result:hover,
.global-search-result:focus-visible {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.14), rgba(96, 165, 250, 0.14));
}

.global-search-result:focus-visible {
  outline: none;
}
</style>
