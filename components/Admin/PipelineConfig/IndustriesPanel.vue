<template>
  <AdminPipelineConfigOptionListPanel
    class="mb-4"
    :loading="loading"
    :store="store"
    i18n-prefix="admin.pipelineConfig.industries"
    add-label-key="addIndustry"
  />
</template>

<script setup lang="ts">
// Company Industry options — a thin wrapper over the generic OptionListPanel (kept under
// this name because pages/admin/pipeline-config.vue renders it directly).
defineProps<{
  loading: boolean
}>()

const store = useIndustryOptionsStore()
</script>
