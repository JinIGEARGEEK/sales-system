<template>
  <AdminPipelineConfigOptionListPanel
    :loading="loading"
    :store="store"
    i18n-prefix="admin.pipelineConfig.productCategories"
    add-label-key="addCategory"
  />
</template>

<script setup lang="ts">
// Product Category options — a thin wrapper over the generic OptionListPanel (kept under
// this name because pages/admin/pipeline-config.vue renders it directly).
defineProps<{
  loading: boolean
}>()

const store = useProductCategoryOptionsStore()
</script>
