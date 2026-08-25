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

const props = defineProps<{
  activeTab: string
}>()

const { t } = useI18n()

const roleFocus = computed(() => t(`admin.guideline.roleFocus.${props.activeTab}`))

const roleFocusIconByTab: Record<string, string> = {
  salesRep: 'material-symbols:person-outline',
  salesManager: 'material-symbols:supervisor-account-outline',
  admin: 'material-symbols:shield-person-outline',
  production: 'material-symbols:precision-manufacturing-outline',
}
const roleFocusIcon = computed(() => roleFocusIconByTab[props.activeTab] ?? 'material-symbols:person-outline')
</script>
