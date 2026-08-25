<template>
  <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const activeTab = defineModel<string>({ required: true })

const { t } = useI18n()

const tabItems = computed(() => [
  { label: t('admin.guideline.roleTabs.salesRep'), value: 'salesRep' },
  { label: t('admin.guideline.roleTabs.salesManager'), value: 'salesManager' },
  { label: t('admin.guideline.roleTabs.admin'), value: 'admin' },
  { label: t('admin.guideline.roleTabs.production'), value: 'production' },
])
</script>
