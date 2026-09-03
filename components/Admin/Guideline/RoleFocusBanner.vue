<template>
  <UCard :ui="{ root: `${GLASS_PANEL_UI.root} border-l-4 border-l-[var(--color-primary)]` }" class="mb-4">
    <div class="flex items-start gap-2.5">
      <UIcon :name="roleFocusIcon" class="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
      <p class="text-sm">{{ roleFocus }}</p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'
import { GUIDELINE_TABS } from './tabs'

const props = defineProps<{
  activeTab: string
}>()

const { t } = useI18n()

const roleFocus = computed(() => t(`admin.guideline.roleFocus.${props.activeTab}`))

const roleFocusIcon = computed(() =>
  GUIDELINE_TABS.find(tab => tab.value === props.activeTab)?.icon ?? 'material-symbols:person-outline')
</script>
