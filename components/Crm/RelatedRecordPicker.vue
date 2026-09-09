<template>
  <InputSelect
    v-model="form.related_type"
    :label="typeLabel"
    :placeholder="typePlaceholder"
    name="related_type"
    :options="RELATED_TYPE_OPTIONS"
    rules="required"
  />
  <InputCompanySelect
    v-if="form.related_type === 'company'"
    v-model="relatedRecordId"
    :label="recordLabel"
    :placeholder="companyRecordPlaceholder ?? recordPlaceholder"
    name="related_id"
    rules="required"
  />
  <InputAsyncSelect
    v-else-if="form.related_type === 'deal'"
    v-model="relatedRecordId"
    :search="searchDeals"
    :resolve-selected="resolveDeal"
    :label="recordLabel"
    :placeholder="recordPlaceholder"
    name="related_id"
    rules="required"
  />
  <InputAsyncSelect
    v-else-if="form.related_type === 'contact'"
    v-model="relatedRecordId"
    :search="searchContacts"
    :resolve-selected="resolveContact"
    :label="recordLabel"
    :placeholder="recordPlaceholder"
    name="related_id"
    rules="required"
  />
  <InputAsyncSelect
    v-else-if="form.related_type === 'prospect'"
    v-model="relatedRecordId"
    :search="searchProspects"
    :resolve-selected="resolveProspect"
    :label="recordLabel"
    :placeholder="recordPlaceholder"
    name="related_id"
    rules="required"
  />
</template>

<script setup lang="ts">
import { RELATED_TYPE_OPTIONS } from '~/constants/mockData'

// The "Relates To" type + record picker shared by AddTaskModal and
// AddActivityModal's own showRelatedPicker mode — was ~48 lines of identical
// template duplicated in both once AddActivityModal needed the exact same
// UI. `form` is v-model:form-bound to the parent's own reactive() form
// object (from useModalForm) — defineModel (not a plain prop) since
// useRelatedRecordPicker mutates its related_type/related_id fields
// in-place (clearing related_id on a type change), which vue/no-mutating-props
// disallows on a plain prop but not on a defineModel ref.
const form = defineModel<{ related_type: string, related_id: string }>('form', { required: true })

defineProps<{
  typeLabel: string
  typePlaceholder: string
  recordLabel: string
  recordPlaceholder: string
  // Only the 'company' branch above is creatable (InputCompanySelect) —
  // Deal/Contact/Prospect are search-only (InputAsyncSelect, no create-item
  // support). recordPlaceholder alone would either read select-only for
  // Company or falsely imply creatability for the other three, so this is a
  // separate, optional override applied only when related_type === 'company';
  // falls back to recordPlaceholder when a caller doesn't pass one.
  companyRecordPlaceholder?: string
}>()

const { searchDeals, resolveDeal, searchContacts, resolveContact, searchProspects, resolveProspect, relatedRecordId } = useRelatedRecordPicker(form.value)
</script>
