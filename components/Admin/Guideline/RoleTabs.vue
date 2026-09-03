<template>
  <div class="mb-4 overflow-x-auto">
    <UTabs v-model="activeTab" :items="tabItems" :ui="{ list: 'w-max min-w-full', trigger: 'grow-0 shrink-0' }" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GUIDELINE_TABS } from './tabs'

const activeTab = defineModel<string>({ required: true })

const { t } = useI18n()

const tabItems = computed(() => GUIDELINE_TABS.map(tab => ({
  label: t(`admin.guideline.roleTabs.${tab.value}`),
  value: tab.value,
})))
</script>
