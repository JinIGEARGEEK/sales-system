<template>
  <AdminPipelineConfigOptionListPanel
    class="mb-4"
    :loading="loading"
    :store="store"
    i18n-prefix="admin.pipelineConfig.prospectSources"
    add-label-key="addSource"
  />
</template>

<script setup lang="ts">
// Prospect (marketing funnel) sources — a thin wrapper over the generic OptionListPanel (kept under
// this name because pages/admin/pipeline-config.vue renders it directly).
defineProps<{
  loading: boolean
}>()

const store = useProspectSourcesStore()
</script>
