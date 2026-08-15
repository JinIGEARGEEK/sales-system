<template>
  <div class="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#121b40_0%,#243a90_28%,#3f64d9_58%,#82a6f0_100%)] p-4">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-linear-to-br from-sky-400/50 to-blue-600/15 blur-3xl" />
      <div class="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-linear-to-br from-blue-400/40 to-indigo-700/15 blur-3xl" />
      <div class="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-linear-to-tr from-cyan-400/30 to-blue-500/10 blur-3xl" />
      <slot name="background" />
    </div>

    <div class="auth-card relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/25 bg-white/5 p-8 shadow-[0_8px_40px_rgba(2,8,31,0.45)] backdrop-blur-sm backdrop-saturate-50 backdrop-brightness-110" :class="cardClass">
      <!-- glass sheen -->
      <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/15 via-white/3 to-transparent" />
      <!-- laser edge highlights: top + left only -->
      <div class="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full bg-linear-to-r from-transparent via-white to-transparent shadow-[0_0_10px_1px_rgba(190,225,255,0.9)]" />
      <div class="pointer-events-none absolute inset-y-6 left-0 w-px rounded-full bg-linear-to-b from-transparent via-white to-transparent shadow-[0_0_10px_1px_rgba(190,225,255,0.9)]" />

      <div class="relative z-10 flex items-center justify-center gap-2.5 text-center text-2xl font-semibold text-white" :class="subtitle ? 'mb-2' : 'mb-8'">
        <UIcon :name="icon" class="size-7" />
        {{ title }}
      </div>
      <p v-if="subtitle" class="relative z-10 mb-6 text-center text-xs text-white/70">
        {{ subtitle }}
      </p>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'material-symbols:hub-outline',
  },
  cardClass: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.auth-card {
  --color-black: #ffffff;
  --color-gray: #cbd5e1;
}
</style>
