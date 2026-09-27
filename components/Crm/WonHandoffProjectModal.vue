<template>
  <CrmAddProjectModal
    v-model:open="projectModal"
    :title="t('crm.deals.detail.createProjectModalTitle')"
    :default-name="handoffDeal?.title"
    :default-target-end-date="handoffDeal?.expected_close_date"
    :description="t('crm.deals.detail.createProjectModalBody')"
    @submit="onCreateProject"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// The Won hand-off's "Create Project from this Deal?" prompt, bound to a
// useDealWonHandoff() instance: it opens when the hand-off sets
// `projectModal`, prefills from the Deal being handed off, and saves through
// the hand-off's onCreateProject (which keeps it open on failure).
const props = defineProps<{
  handoff: DealWonHandoff
}>()

const { t } = useI18n()
// Top-level bindings so the template unwraps the refs.
const { projectModal, handoffDeal, onCreateProject } = props.handoff
</script>
