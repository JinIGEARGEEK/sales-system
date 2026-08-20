<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-full p-0.5 text-xs"
    :class="glass ? 'bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.2)] backdrop-blur-md' : ''"
    :style="glass ? undefined : { backgroundColor: 'color-mix(in srgb, currentColor 8%, transparent)' }"
  >
    <button
      type="button"
      class="cursor-pointer rounded-full px-2 py-1 transition-all"
      :class="glass ? 'switch-lang-glass-btn focus-visible:outline-none' : ''"
      :style="glassStyle('th')"
      @click="switchLang('th')"
    >
      TH
    </button>
    <button
      type="button"
      class="cursor-pointer rounded-full px-2 py-1 transition-all"
      :class="glass ? 'switch-lang-glass-btn focus-visible:outline-none' : ''"
      :style="glassStyle('en')"
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

// `glass` renders a blue glass-light chip instead of the default
// currentColor-tinted pill — used on dark/glass surfaces like the sidebar.
const { glass = false } = defineProps<{ glass?: boolean }>()

const glassStyle = (lang: string) => {
  const isCurrent = locale.value === lang
  if (glass) {
    return {
      backgroundColor: isCurrent ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
      boxShadow: isCurrent ? '0 0 8px rgba(96, 165, 250, 0.35)' : 'none',
      color: isCurrent ? '#EAF2FF' : 'rgba(255, 255, 255, 0.55)',
    }
  }
  return {
    backgroundColor: isCurrent ? 'color-mix(in srgb, currentColor 18%, transparent)' : 'transparent',
    opacity: isCurrent ? 1 : 0.55,
  }
}

const switchLang = (lang: string) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
  setLocale(lang)
}
</script>

<style scoped>
.switch-lang-glass-btn:hover,
.switch-lang-glass-btn:focus-visible {
  background-color: rgba(96, 165, 250, 0.2) !important;
  color: #EAF2FF !important;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.3);
}
</style>
