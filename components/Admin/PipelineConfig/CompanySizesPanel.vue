<template>
  <AdminPipelineConfigOptionListPanel
    class="mb-4"
    :loading="loading"
    :store="store"
    i18n-prefix="admin.pipelineConfig.companySizes"
    add-label-key="addSize"
  />
</template>

<script setup lang="ts">
// Company Size options — a thin wrapper over the generic OptionListPanel (kept under
// this name because pages/admin/pipeline-config.vue renders it directly).
defineProps<{
  loading: boolean
}>()

const store = useCompanySizeOptionsStore()
</script>
