<template>
  <UModal
    :open="open"
    :title="t(`${prefix}.title`, { entity: entityPlural })"
    :description="step === 'pick' ? t(`${prefix}.pickDescription`, { entity: entityPlural }) : t(`${prefix}.reviewDescription`)"
    data-cy="merge-duplicates-modal"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <div v-if="step === 'pick'" class="flex flex-col gap-4">
        <section>
          <p class="mb-2 text-xs text-(--color-gray)">{{ t(`${prefix}.survivorHeading`) }}</p>
          <div v-if="target" class="rounded-lg border border-(--color-light-gray-2) p-3 text-sm" data-cy="merge-survivor">
            <p class="font-medium">{{ target.name }}</p>
            <p class="text-xs text-(--color-gray)">{{ t(`${prefix}.thisRecord`, { entity: entitySingular }) }}</p>
          </div>
          <URadioGroup
            v-else-if="records.length > 0"
            v-model="survivorId"
            :items="records.map(record => ({ label: record.name, description: record.detail, value: record.id }))"
            data-cy="merge-survivor-picker"
          />
          <p v-else class="text-sm text-(--color-gray)">{{ t(`${prefix}.pickSomeFirst`) }}</p>
        </section>

        <section>
          <p class="mb-2 text-xs text-(--color-gray)">{{ t(`${prefix}.sourcesHeading`, { count: sources.length, max: MERGE_MAX_SOURCES }) }}</p>
          <ul v-if="sources.length > 0" class="flex flex-col gap-1" data-cy="merge-sources">
            <li
              v-for="record in sources"
              :key="record.id"
              class="flex items-center justify-between gap-2 rounded-md bg-(--color-light-gray-1) px-3 py-2 text-sm"
              :data-cy="`merge-source-${record.id}`"
            >
              <span class="min-w-0">
                <span class="block truncate">{{ record.name }}</span>
                <span v-if="record.detail" class="block truncate text-xs text-(--color-gray)">{{ record.detail }}</span>
              </span>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="material-symbols:close"
                :aria-label="t(`${prefix}.remove`, { name: record.name })"
                @click="removeRecord(record.id)"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-(--color-gray)">{{ t(`${prefix}.noSources`) }}</p>
        </section>

        <section>
          <!-- A search box, not form data: a plain UInput (no vee-validate Field). -->
          <label for="merge-search" class="mb-1 block text-sm">{{ t(`${prefix}.searchLabel`, { entity: entityPlural }) }}</label>
          <UInput
            id="merge-search"
            v-model="term"
            class="w-full"
            icon="material-symbols:search"
            autocomplete="off"
            :placeholder="t(`${prefix}.searchPlaceholder`)"
            data-cy="merge-search"
          />
          <div v-if="term.trim()" class="mt-2 flex flex-col gap-1" data-cy="merge-results">
            <p v-if="searching" class="text-xs text-(--color-gray)">{{ t('global.loading') }}</p>
            <p v-else-if="results.length === 0" class="text-xs text-(--color-gray)">{{ t(`${prefix}.noMatches`) }}</p>
            <button
              v-for="record in results"
              v-else
              :key="record.id"
              type="button"
              class="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-(--color-light-gray-1) disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="sources.length >= MERGE_MAX_SOURCES"
              :data-cy="`merge-result-${record.id}`"
              @click="addRecord(record)"
            >
              <span class="min-w-0">
                <span class="block truncate">{{ record.name }}</span>
                <span v-if="record.detail" class="block truncate text-xs text-(--color-gray)">{{ record.detail }}</span>
              </span>
              <UIcon name="material-symbols:add" class="size-4 shrink-0 text-(--color-primary)" />
            </button>
          </div>
        </section>
      </div>

      <div v-else class="flex flex-col gap-4 text-sm" data-cy="merge-review">
        <section>
          <p class="mb-1 text-xs text-(--color-gray)">{{ t(`${prefix}.survivorHeading`) }}</p>
          <p class="font-medium" data-cy="merge-review-survivor">{{ survivor?.name }}</p>
        </section>
        <section>
          <p class="mb-1 text-xs text-(--color-gray)">{{ t(`${prefix}.reviewSourcesHeading`, { count: sources.length }) }}</p>
          <ul class="list-disc pl-5">
            <li v-for="record in sources" :key="record.id">{{ record.name }}</li>
          </ul>
        </section>
        <section>
          <p class="mb-1 text-xs text-(--color-gray)">{{ t(`${prefix}.whatHappens`) }}</p>
          <ul class="list-disc pl-5" data-cy="merge-review-effects">
            <li>{{ t(`${prefix}.effects.move.${entity}`, { name: survivor?.name }) }}</li>
            <li>{{ t(`${prefix}.effects.fill`, { name: survivor?.name }) }}</li>
            <li>{{ t(`${prefix}.effects.keep`, { name: survivor?.name }) }}</li>
            <li>{{ t(`${prefix}.effects.trash`) }}</li>
          </ul>
        </section>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full gap-3">
        <template v-if="step === 'pick'">
          <ButtonPrimary class="flex-1" :label="t(`${prefix}.cancel`)" cancel @click="onUpdateOpen(false)" />
          <ButtonPrimary class="flex-1" :label="t(`${prefix}.next`)" :disabled="!canContinue" data-cy="merge-next" @click="step = 'review'" />
        </template>
        <template v-else>
          <ButtonPrimary class="flex-1" :label="t(`${prefix}.back`)" cancel :disabled="loading" @click="step = 'pick'" />
          <ButtonPrimary
            class="flex-1"
            :label="t(`${prefix}.confirm`, { count: sources.length })"
            icon="material-symbols:merge"
            :loading="loading"
            data-cy="merge-confirm"
            @click="onConfirm"
          />
        </template>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MergeEntity, MergeRecord } from '~/composables/utils/useMergeDuplicates'

// "Merge duplicates" for Companies/Contacts (POST /<entity>/:id/merge,
// Admin/Sales Manager). Step 1 picks the records: from a detail page the
// survivor is fixed (`target`, "this one") and duplicates are searched and
// added; from a list's bulk selection (`candidates`) the user picks which
// selected record survives. `initialSourceIds` pre-adds records by id (the
// duplicate-conflict alert's matches). Step 2 previews what happens, and
// Merge runs it; `merged` fires with the result so the opener can refresh.
const props = defineProps<{
  open: boolean
  entity: MergeEntity
  target?: MergeRecord | null
  candidates?: MergeRecord[]
  initialSourceIds?: number[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'merged': [result: MergeResult<Company | Contact>, survivorId: number]
}>()

const prefix = 'crm.components.mergeDuplicates'
const { t } = useI18n()
const { notifyApiError } = useApiErrorNotifier()
const { merge, fetchRecord, searchRecords } = useMergeDuplicates(props.entity)
const { loading, guard } = useSubmitGuard()

const entitySingular = computed(() => t(`${prefix}.entities.${props.entity}.one`))
const entityPlural = computed(() => t(`${prefix}.entities.${props.entity}.other`))

const step = ref<'pick' | 'review'>('pick')
// Every record in the merge, the survivor included.
const records = ref<MergeRecord[]>([])
const survivorId = ref<number | null>(null)
const term = ref('')
const results = ref<MergeRecord[]>([])
const searching = ref(false)

const survivor = computed(() => records.value.find(record => record.id === survivorId.value) ?? null)
const sources = computed(() => records.value.filter(record => record.id !== survivorId.value))
const canContinue = computed(() => survivor.value !== null && sources.value.length >= 1 && sources.value.length <= MERGE_MAX_SOURCES)

const reset = async () => {
  step.value = 'pick'
  term.value = ''
  results.value = []
  records.value = props.target ? [props.target] : [...(props.candidates ?? [])]
  survivorId.value = props.target?.id ?? props.candidates?.[0]?.id ?? null
  const extra = (props.initialSourceIds ?? []).filter(id => !records.value.some(record => record.id === id))
  for (const id of extra.slice(0, MERGE_MAX_SOURCES)) {
    try {
      addRecord(await fetchRecord(id))
    } catch (err) {
      notifyApiError(err)
    }
  }
}

watch(() => props.open, (value) => {
  if (value) reset()
}, { immediate: true })

const addRecord = (record: MergeRecord) => {
  if (records.value.some(existing => existing.id === record.id) || sources.value.length >= MERGE_MAX_SOURCES) return
  records.value = [...records.value, record]
  if (survivorId.value === null) survivorId.value = record.id
  results.value = results.value.filter(result => result.id !== record.id)
}

const removeRecord = (id: number) => {
  records.value = records.value.filter(record => record.id !== id)
  if (survivorId.value === id) survivorId.value = records.value[0]?.id ?? null
}

// Server-side search, minus the records already in the merge.
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchSeq = 0
watch(term, (value) => {
  clearTimeout(searchTimer)
  const query = value.trim()
  if (!query) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq
    try {
      const found = await searchRecords(query, 10)
      if (seq !== searchSeq) return
      results.value = found.filter(item => !records.value.some(record => record.id === item.id))
    } catch (err) {
      notifyApiError(err)
    } finally {
      if (seq === searchSeq) searching.value = false
    }
  }, 300)
})

const onUpdateOpen = (value: boolean) => {
  if (!value && loading.value) return
  emit('update:open', value)
}

const nameOf = (id: number) => records.value.find(record => record.id === id)?.name ?? `#${id}`

const onConfirm = guard(async () => {
  if (!survivor.value || !canContinue.value) return
  const targetId = survivor.value.id
  const result = await merge(targetId, sources.value.map(record => record.id), nameOf)
  if (!result) return
  emit('merged', result, targetId)
  emit('update:open', false)
})
</script>
