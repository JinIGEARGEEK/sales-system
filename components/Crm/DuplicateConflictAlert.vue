<template>
  <!-- The server's duplicate 409 on a Lead/Prospect/Contact create (see
  composables/utils/useDuplicateConflict.ts): which field matched, links to
  the existing record(s), and a "Create anyway" that resends with
  ?allow_duplicate=true. -->
  <UAlert
    class="mb-4"
    color="warning"
    variant="subtle"
    icon="material-symbols:warning-outline"
    role="alert"
    :title="t('crm.components.duplicateConflict.title', { entity: entityLabel })"
    data-cy="duplicate-conflict-alert"
  >
    <template #description>
      <p>{{ t('crm.components.duplicateConflict.matched', { fields: fieldsLabel }) }}</p>
      <ul class="mt-2 list-disc pl-5">
        <li v-for="id in conflict.ids" :key="id">
          <NuxtLink :to="`${basePath}/${id}`" class="font-medium hover:underline" data-cy="duplicate-conflict-link">
            {{ nameOf?.(id) || t('crm.components.duplicateConflict.recordFallback', { entity: entityLabel, id }) }}
          </NuxtLink>
        </li>
      </ul>
      <div class="mt-3 flex flex-wrap gap-2">
        <ButtonPrimary
          small
          fit-content
          outline
          :label="t('crm.components.duplicateConflict.createAnyway')"
          :loading="loading"
          :loading-auto="false"
          data-cy="duplicate-conflict-create-anyway"
          @click="emit('createAnyway')"
        />
        <ButtonPrimary
          small
          fit-content
          cancel
          :label="t('crm.components.duplicateConflict.dismiss')"
          @click="emit('dismiss')"
        />
      </div>
    </template>
  </UAlert>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DuplicateConflict } from '~/composables/utils/useDuplicateConflict'

const { t } = useI18n()

const props = defineProps<{
  conflict: DuplicateConflict
  entity: 'lead' | 'prospect' | 'contact'
  // e.g. '/crm/leads' — each id links to `${basePath}/${id}`.
  basePath: string
  // Display name for a matching id when the page already has it loaded.
  nameOf?: (id: number) => string | undefined
  loading?: boolean
}>()

const emit = defineEmits<{
  createAnyway: []
  dismiss: []
}>()

const entityLabel = computed(() => t(`crm.components.duplicateConflict.entities.${props.entity}`))
const fieldsLabel = computed(() => {
  const names = props.conflict.fields.map(f => t(`crm.components.duplicateConflict.fields.${f}`))
  return names.length > 0 ? names.join(t('crm.components.duplicateConflict.and')) : t('crm.components.duplicateConflict.fields.email_or_phone')
})
</script>
