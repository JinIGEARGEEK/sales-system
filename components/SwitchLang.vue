<template>
  <div class="inline-flex items-center gap-0.5 rounded-full p-0.5 text-xs" style="background-color: color-mix(in srgb, currentColor 8%, transparent)">
    <button
      type="button"
      class="cursor-pointer rounded-full px-2 py-1 transition-opacity"
      :style="{ backgroundColor: locale === 'th' ? 'color-mix(in srgb, currentColor 18%, transparent)' : 'transparent', opacity: locale === 'th' ? 1 : 0.55 }"
      @click="switchLang('th')"
    >
      TH
    </button>
    <button
      type="button"
      class="cursor-pointer rounded-full px-2 py-1 transition-opacity"
      :style="{ backgroundColor: locale === 'en' ? 'color-mix(in srgb, currentColor 18%, transparent)' : 'transparent', opacity: locale === 'en' ? 1 : 0.55 }"
      @click="switchLang('en')"
    >
      EN
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '@vee-validate/i18n'

const { locale } = useI18n()

const switchLang = (lang: string) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
  setLocale(lang)
}
</script>
