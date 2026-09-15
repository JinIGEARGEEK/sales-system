<template>
  <template v-if="source === 'Referral'">
    <InputSelect
      v-model="typeModel"
      :options="REFERRAL_TYPE_OPTIONS"
      :label="t('crm.components.referredByField.typeLabel')"
      :placeholder="t('crm.components.referredByField.typePlaceholder')"
      name="referred_by_type"
    />
    <InputCompanySelect
      v-if="typeModel === 'company'"
      v-model="idNumberProxy"
      :label="t('crm.components.referredByField.label')"
      :placeholder="t('crm.components.referredByField.placeholder')"
      name="referred_by_id"
    />
    <InputAsyncSelect
      v-else-if="typeModel === 'contact'"
      v-model="idNumberProxy"
      :search="searchContacts"
      :resolve-selected="resolveContact"
      :label="t('crm.components.referredByField.label')"
      :placeholder="t('crm.components.referredByField.placeholder')"
      name="referred_by_id"
    />
  </template>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Shared "which existing Company or Contact referred this Lead in" field —
// only rendered while source === 'Referral'. Extracted once this exact
// type-select + conditional Company/Contact-picker + clear-on-change shape
// needed to appear on both pages/crm/leads/create.vue and [id].vue, same
// reason components/Crm/RelatedRecordPicker.vue exists for Task/Activity's
// "Relates To" (see that component's own header comment).
const { t } = useI18n()

const props = defineProps<{
  source: string
  // A detail/edit page that (re)populates its form asynchronously from a
  // fetched record needs to suppress the clearing watchers below while
  // doing that assignment, or hydrating type would immediately wipe the id
  // hydrated alongside it (same "hydrating" convention as
  // useBusinessUnitItemOptions). A create page with no async hydration can
  // just omit the prop (defaults false).
  pauseClearing?: boolean
}>()

const typeModel = defineModel<string>('type', { default: '' })
const idModel = defineModel<string>('id', { default: '' })

// idModel stays a plain string (matching every other InputSelect/
// InputAsyncSelect-bound form field the parent form carries), while
// InputCompanySelect/InputAsyncSelect want a number — same proxy shape as
// useRelatedRecordPicker's own relatedRecordId.
const idNumberProxy = computed<number | null>({
  get: () => idModel.value ? Number(idModel.value) : null,
  set: value => { idModel.value = value ? String(value) : '' },
})

const REFERRAL_TYPE_OPTIONS: Select[] = [
  { label: t('crm.components.referredByField.typeCompany'), value: 'company' },
  { label: t('crm.components.referredByField.typeContact'), value: 'contact' },
]

const contactsStore = useContactsStore()
const { search: searchContacts, resolve: resolveContact } = useAsyncRecordPicker(
  contactsStore.fetchList, contactsStore.fetchOne, c => c.name, 'name',
)

// A Company picked before switching to Contact (or vice versa) would
// otherwise submit as e.g. a Company id under type: 'contact'.
watch(typeModel, () => {
  if (props.pauseClearing) return
  idModel.value = ''
})

// Only shown while source === 'Referral' (see template) — clear both fields
// if a rep picks a referrer, then changes their mind about the source, so a
// stale referrer can't silently persist against a non-referral Lead.
watch(() => props.source, (source) => {
  if (props.pauseClearing) return
  if (source !== 'Referral') {
    typeModel.value = ''
    idModel.value = ''
  }
})
</script>
