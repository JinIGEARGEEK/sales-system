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
          base: 'rounded-full bg-white/10 backdrop-blur-md border border-white/25 ring-1 ring-white/25 text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all placeholder:text-white/55 hover:ring-white/40 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:bg-white/15 py-1.5',
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

// GlobalSearch lives in the layout and mounts once per app load, so this is a
// convenient single place to warm all four stores instead of only relying on
// each CRM page's own on-mount fetch.
onMounted(() => {
  if (!canSearchSalesPipeline.value) return
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (leadsStore.items.length === 0) leadsStore.fetchAll().catch(notifyApiError)
})

const RESULT_LIMIT = 5
const MIN_QUERY_LENGTH = 2

const query = ref('')
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const matches = (...values: string[]) => {
  const needle = query.value.trim().toLowerCase()
  return values.some(value => value.toLowerCase().includes(needle))
}

const resultGroups = computed(() => {
  if (query.value.trim().length < MIN_QUERY_LENGTH || !canSearchSalesPipeline.value) return []

  return [
    {
      key: 'deals',
      label: t('crm.components.globalSearch.deals'),
      items: dealsStore.items.filter(deal => matches(deal.title)).slice(0, RESULT_LIMIT)
        .map(deal => ({ path: `/crm/deals/${deal.id}`, label: deal.title, sublabel: deal.stage })),
    },
    {
      key: 'companies',
      label: t('crm.components.globalSearch.companies'),
      items: companiesStore.items.filter(company => matches(company.name)).slice(0, RESULT_LIMIT)
        .map(company => ({ path: `/crm/companies/${company.id}`, label: company.name, sublabel: company.industry })),
    },
    {
      key: 'contacts',
      label: t('crm.components.globalSearch.contacts'),
      items: contactsStore.items.filter(contact => matches(contact.name)).slice(0, RESULT_LIMIT)
        .map(contact => ({ path: `/crm/contacts/${contact.id}`, label: contact.name, sublabel: contact.role_title })),
    },
    {
      key: 'leads',
      label: t('crm.components.globalSearch.leads'),
      items: leadsStore.items.filter(lead => matches(lead.name, lead.company_name)).slice(0, RESULT_LIMIT)
        .map(lead => ({ path: `/crm/leads/${lead.id}`, label: lead.name, sublabel: lead.company_name })),
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
 * Mirrors the sidebar nav-link treatment in layouts/default.vue: the same
 * yellow-to-blue accent glow on focus, so the search bar reads as part of
 * the same sidebar/topbar system rather than a generic input.
 */
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
