<template>
  <div class="flex flex-col items-center gap-3 py-12 text-center text-(--color-gray)">
    <p>{{ message }}</p>
    <ButtonPrimary
      v-if="backTo"
      :label="t('global.backToList')"
      icon="material-symbols:arrow-back"
      outline
      small
      @click="navigateTo(backTo)"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  message: string
  // Omit on a detail page with no natural list to return to (e.g. Quote
  // detail, reached only via a Deal's Quotes tab).
  backTo?: string
}>()
</script>
