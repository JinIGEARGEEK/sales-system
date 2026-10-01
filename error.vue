<template>
  <!-- Nuxt renders this instead of app.vue (no layout, no UApp) after
  showError()/createError() — e.g. plugins/axios.ts on a page load's 404.
  UApp is repeated here so Nuxt UI components get their providers. -->
  <UApp>
    <main class="flex min-h-screen items-center justify-center bg-(--color-content-bg) p-4">
      <UCard class="w-full max-w-md text-center" :ui="{ body: 'flex flex-col items-center gap-3 p-8' }">
        <div class="flex size-14 items-center justify-center rounded-full bg-(--color-light-gray-1)">
          <UIcon :name="icon" class="size-7 text-(--color-dark-gray)" aria-hidden="true" />
        </div>
        <p class="text-sm font-medium text-(--color-gray)">{{ statusCode }}</p>
        <h1 class="text-xl font-medium">{{ title }}</h1>
        <p class="text-sm text-(--color-dark-gray)">{{ message }}</p>
        <ButtonPrimary
          class="mt-2"
          :label="t('global.backToHome')"
          icon="material-symbols:home-outline"
          data-cy="error-back-home"
          @click="backToHome"
        />
      </UCard>
    </main>
  </UApp>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

const icon = computed(() => isNotFound.value ? 'material-symbols:search-off' : 'material-symbols:error-outline')
const title = computed(() => t(isNotFound.value ? 'global.errorPage.notFoundTitle' : 'global.errorPage.errorTitle'))
const message = computed(() => t(isNotFound.value ? 'global.errorPage.notFoundMessage' : 'global.errorPage.errorMessage'))

useHead({ title })

const backToHome = () => clearError({ redirect: '/' })
</script>
