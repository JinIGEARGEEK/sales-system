import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'

export type MergeEntity = 'company' | 'contact'

// One record in the merge dialog: what the picker and the preview show.
export interface MergeRecord {
  id: number
  name: string
  detail?: string
}

// POST /<entity>/:id/merge takes 1–20 source ids.
export const MERGE_MAX_SOURCES = 20

export const companyMergeRecord = (company: Pick<Company, 'id' | 'name' | 'industry' | 'tax_id'>, unnamed: string): MergeRecord => ({
  id: company.id,
  name: company.name?.trim() || unnamed,
  detail: [company.industry, company.tax_id].filter(Boolean).join(' · ') || undefined,
})

export const contactMergeRecord = (contact: Pick<Contact, 'id' | 'name' | 'email' | 'phone'>): MergeRecord => ({
  id: contact.id,
  name: contact.name,
  detail: [contact.email, contact.phone].filter(Boolean).join(' · ') || undefined,
})

// The store calls behind CrmMergeDuplicatesModal, per entity: one record by
// id (the duplicate-conflict alert's pre-picked matches), a server-side
// search (the stores' `items` caches are capped at 200 rows), and the merge.
interface MergeSource {
  fetchRecord: (id: number) => Promise<MergeRecord>
  searchRecords: (search: string, limit: number) => Promise<MergeRecord[]>
  merge: (targetId: number, sourceIds: number[]) => Promise<MergeResult<Company | Contact>>
}

// The dialog's data and the merge's result/error reporting, shared by its
// three entry points (a detail page's "Merge duplicates…", the list's bulk
// "Merge", the duplicate-conflict alert). `merge()` resolves the result, or
// null after it has toasted why it failed:
//   - success: "N duplicates merged, M linked records moved" (+ which empty
//     fields were filled), then one warning listing the conflicts — fields
//     where a source had a different value and this record kept its own;
//   - 422 source_ids: the selection itself was refused (too many, the target
//     itself, a different type, …); 404: a picked record no longer exists;
//     403: not a manager — each in words, never the API's English.
export const useMergeDuplicates = (entity: MergeEntity) => {
  const { t, te } = useI18n()
  const { success, warning, error } = useNotify()
  const companiesStore = useCompaniesStore()
  const contactsStore = useContactsStore()
  const prefix = 'crm.components.mergeDuplicates'

  const source: MergeSource = entity === 'company'
    ? {
        fetchRecord: async id => companyMergeRecord(await companiesStore.fetchOne(id), t('global.unnamedCompany')),
        searchRecords: async (search, limit) => (await companiesStore.fetchList({ search, per_page: limit })).items
          .map(company => companyMergeRecord(company, t('global.unnamedCompany'))),
        merge: (targetId, sourceIds) => companiesStore.merge(targetId, sourceIds),
      }
    : {
        fetchRecord: async id => contactMergeRecord(await contactsStore.fetchOne(id)),
        searchRecords: async (search, limit) => (await contactsStore.fetchList({ search, per_page: limit })).items.map(contactMergeRecord),
        merge: (targetId, sourceIds) => contactsStore.merge(targetId, sourceIds),
      }

  const fieldLabel = (field: string) => (te(`${prefix}.fields.${field}`) ? t(`${prefix}.fields.${field}`) : field.replace(/_/g, ' '))

  const valueText = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-'
    const text = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)
    return text.length > 60 ? `${text.slice(0, 57)}...` : text
  }

  const movedLabel = (key: string, count: number) =>
    (te(`${prefix}.moved.${key}`) ? t(`${prefix}.moved.${key}`, { count }) : `${count} ${key.replace(/_/g, ' ')}`)

  // The API lists every `moved` key (0 when nothing moved) plus `total`.
  const movedBreakdown = (moved: MergeResult<unknown>['moved']) => Object.entries(moved)
    .filter(([key, count]) => key !== 'total' && count > 0)
    .map(([key, count]) => movedLabel(key, count))
    .join(', ')

  const reportResult = (result: MergeResult<unknown>, sourceCount: number, nameOf: (id: number) => string) => {
    const breakdown = movedBreakdown(result.moved)
    const lines = [
      breakdown ? t(`${prefix}.result.movedBreakdown`, { list: breakdown }) : '',
      result.filled.length > 0 ? t(`${prefix}.result.filled`, { fields: result.filled.map(fieldLabel).join(', ') }) : '',
    ].filter(Boolean)
    success(t(`${prefix}.result.merged`, { count: sourceCount, total: result.moved.total }), undefined, { description: lines.join('\n') || undefined })
    // Conflicts are fields this record kept (website/tax ID/branch for a
    // company, email/phone for a contact) where a source had another value.
    if (result.conflicts.length > 0) {
      const conflictLines = result.conflicts.slice(0, 8).map(conflict => t(`${prefix}.result.conflictLine`, {
        field: fieldLabel(conflict.field),
        source: nameOf(conflict.source_id),
        value: valueText(conflict.value),
      }))
      if (result.conflicts.length > 8) conflictLines.push(t(`${prefix}.result.moreConflicts`, { count: result.conflicts.length - 8 }))
      warning(t(`${prefix}.result.conflicts`, { count: result.conflicts.length }), undefined, { description: conflictLines.join('\n'), duration: 15000 })
    }
  }

  // A 404 names the missing ids ("Company not found: 3, 9") — shown by the
  // names the dialog already has, in words.
  const missingIds = (err: unknown) => {
    const message = getApiErrorMessage(err, '')
    const list = message.includes(':') ? message.slice(message.lastIndexOf(':') + 1) : ''
    return (list.match(/\d+/g) ?? []).map(Number)
  }

  const errorMessage = (err: unknown, nameOf: (id: number) => string) => {
    const status = getApiErrorStatus(err)
    if (status === 403) return t(`${prefix}.errors.forbidden`)
    if (status === 404) {
      const ids = missingIds(err)
      return ids.length > 0
        ? t(`${prefix}.errors.notFoundNames`, { names: ids.map(nameOf).join(', ') })
        : t(`${prefix}.errors.notFound`)
    }
    const codes = getApiErrorFields(err)?.source_ids
    if (codes) {
      const code = codes[0]
      return code && te(`${prefix}.errors.${code}`) ? t(`${prefix}.errors.${code}`) : t(`${prefix}.errors.invalidSelection`)
    }
    return t('global.genericError')
  }

  const merge = async (targetId: number, sourceIds: number[], nameOf: (id: number) => string = id => `#${id}`) => {
    try {
      const result = await source.merge(targetId, sourceIds)
      reportResult(result, sourceIds.length, nameOf)
      return result
    } catch (err) {
      error(errorMessage(err, nameOf))
      return null
    }
  }

  return { merge, fetchRecord: source.fetchRecord, searchRecords: source.searchRecords }
}

// POST /<entity>/:id/merge is Admin/Sales Manager only (403 otherwise).
const useCanMerge = () => {
  const { hasRole } = useRole()
  return computed(() => hasRole(...MANAGER_ROLES))
}

// A list's bulk "Merge": the selected rows, the first one preselected to stay
// (the dialog lets the user pick another). `onMerged` reloads the list — the
// sources are in Trash now.
export const useBulkMerge = <T>(selected: Ref<T[]>, toRecord: (row: T) => MergeRecord) => {
  const canMerge = useCanMerge()
  const mergeOpen = ref(false)
  const mergeCandidates = ref<MergeRecord[]>([])
  const openBulkMerge = () => {
    mergeCandidates.value = selected.value.map(toRecord)
    mergeOpen.value = true
  }
  return { canMerge, mergeOpen, mergeCandidates, openBulkMerge }
}

// A detail page's "Merge duplicates…" entry. `?merge=` on the URL opens the dialog on arrival —
// `?merge=4,9` with those records already picked (the duplicate-conflict
// alert links here that way) — and is then dropped from the URL.
export const useDetailMerge = () => {
  const route = useRoute()
  const router = useRouter()
  const canMerge = useCanMerge()
  const mergeOpen = ref(false)
  const mergeInitialIds = ref<number[]>([])

  onMounted(() => {
    const raw = route.query.merge
    if (raw === undefined || raw === null) return
    const { merge: _merge, ...rest } = route.query
    router.replace({ query: rest })
    if (!canMerge.value) return
    mergeInitialIds.value = String(raw).split(',').map(Number).filter(id => Number.isInteger(id) && id > 0)
    mergeOpen.value = true
  })

  const openMerge = () => {
    mergeInitialIds.value = []
    mergeOpen.value = true
  }

  return { canMerge, mergeOpen, mergeInitialIds, openMerge }
}
