<template>
  <UAlert
    v-if="!canAccess"
    color="error"
    variant="subtle"
    icon="material-symbols:lock-outline"
    :title="title ?? t('global.noAccessTitle')"
    :description="label ?? t('global.noAccess')"
  />
  <slot v-else />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Shared "no access" placeholder + slot toggle — pairs with the
// `usePageAccess()` composable, which the page's own <script setup> also
// uses to guard its onMounted fetches (this component only handles the
// template half; it doesn't own the access-check logic itself, so both stay
// in sync off the same computed value). Styled to match the pre-existing
// UAlert pattern already used by every pages/crm/reports/*.vue page, rather
// than inventing a second "access denied" look. `title`/`label` default to
// the generic global.noAccessTitle/noAccess strings — pass your own when a
// more specific message is warranted (e.g. Reports' "Only Admins and Sales
// Managers can view reports").
defineProps<{
  canAccess: boolean
  label?: string
  title?: string
}>()

const { t } = useI18n()
</script>
