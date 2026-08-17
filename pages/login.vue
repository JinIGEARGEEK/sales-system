<template>
  <AuthCard title="CRM System" card-class="-translate-y-21">
    <template #background>
      <!-- shared glass-logo def, rendered once and reused via <use> below -->
      <svg width="0" height="0" class="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="glassLogoFill" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stop-color="#eaf3ff" stop-opacity="0.9" />
            <stop offset="45%" stop-color="#7ea6ec" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#22397d" stop-opacity="0.32" />
          </linearGradient>
          <linearGradient id="glassLogoHighlight" x1="0%" y1="0%" x2="100%" y2="70%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5" />
            <stop offset="30%" stop-color="#ffffff" stop-opacity="0.12" />
            <stop offset="55%" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>
          <filter id="glassLogoShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#02081f" flood-opacity="0.3" />
          </filter>
          <mask id="glassLogoMaskLeft" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="230">
            <rect x="0" y="0" width="400" height="230" fill="black" />
            <rect x="10" y="20" width="180" height="190" rx="50" fill="white" />
            <path
              d="M77,65 L195,65 L195,136 L145,136 L145,143 A22,22 0 0 1 123,165 L77,165 A22,22 0 0 1 55,143 L55,87 A22,22 0 0 1 77,65 Z"
              fill="black"
            />
          </mask>
          <mask id="glassLogoMaskRight" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="230">
            <rect x="0" y="0" width="400" height="230" fill="black" />
            <rect x="210" y="20" width="180" height="190" rx="50" fill="white" />
            <path
              d="M323,65 L205,65 L205,136 L255,136 L255,143 A22,22 0 0 0 277,165 L323,165 A22,22 0 0 0 345,143 L345,87 A22,22 0 0 0 323,65 Z"
              fill="black"
            />
          </mask>
          <!-- two open "G"-shaped brackets facing each other, bridged by a center bar -->
          <symbol id="glassLinkLogo" viewBox="0 0 400 230">
            <g filter="url(#glassLogoShadow)">
              <rect x="10" y="20" width="180" height="190" rx="50" fill="url(#glassLogoFill)" mask="url(#glassLogoMaskLeft)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.55" />
              <rect x="10" y="20" width="180" height="190" rx="50" fill="url(#glassLogoHighlight)" mask="url(#glassLogoMaskLeft)" style="mix-blend-mode:screen" />

              <rect x="210" y="20" width="180" height="190" rx="50" fill="url(#glassLogoFill)" mask="url(#glassLogoMaskRight)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.55" />
              <rect x="210" y="20" width="180" height="190" rx="50" fill="url(#glassLogoHighlight)" mask="url(#glassLogoMaskRight)" style="mix-blend-mode:screen" />

              <rect x="120" y="94" width="160" height="42" rx="21" fill="url(#glassLogoFill)" stroke="#ffffff" stroke-width="1" stroke-opacity="0.55" />
              <rect x="120" y="94" width="160" height="42" rx="21" fill="url(#glassLogoHighlight)" style="mix-blend-mode:screen" />
            </g>
          </symbol>
        </defs>
      </svg>

      <svg viewBox="0 0 400 230" class="absolute -top-6 -left-10 w-64 opacity-45 -rotate-12"><use href="#glassLinkLogo" /></svg>
      <svg viewBox="0 0 400 230" class="absolute top-[6%] -right-12 w-72 opacity-40 rotate-6"><use href="#glassLinkLogo" /></svg>
      <svg viewBox="0 0 400 230" class="absolute -bottom-8 -left-12 w-72 opacity-45 rotate-3"><use href="#glassLinkLogo" /></svg>
      <svg viewBox="0 0 400 230" class="absolute -bottom-10 right-[4%] w-60 opacity-40 -rotate-6"><use href="#glassLinkLogo" /></svg>

      <!-- hub icon shape (matching the CRM System header icon), glowing: one at the card's top-left corner, a smaller one at the right side -->
      <svg class="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="none">
        <defs>
          <filter id="traceGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          <g id="hubIcon">
            <!-- spokes from center to each outer node -->
            <line x1="0" y1="0" x2="0" y2="-100" stroke="#bdeeff" stroke-width="6" stroke-linecap="round" filter="url(#traceGlow)" opacity="0.85" />
            <line x1="0" y1="0" x2="0" y2="-100" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
            <line x1="0" y1="0" x2="95.1" y2="-30.9" stroke="#bdeeff" stroke-width="6" stroke-linecap="round" filter="url(#traceGlow)" opacity="0.85" />
            <line x1="0" y1="0" x2="95.1" y2="-30.9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
            <line x1="0" y1="0" x2="58.8" y2="80.9" stroke="#bdeeff" stroke-width="6" stroke-linecap="round" filter="url(#traceGlow)" opacity="0.85" />
            <line x1="0" y1="0" x2="58.8" y2="80.9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
            <line x1="0" y1="0" x2="-58.8" y2="80.9" stroke="#bdeeff" stroke-width="6" stroke-linecap="round" filter="url(#traceGlow)" opacity="0.85" />
            <line x1="0" y1="0" x2="-58.8" y2="80.9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
            <line x1="0" y1="0" x2="-95.1" y2="-30.9" stroke="#bdeeff" stroke-width="6" stroke-linecap="round" filter="url(#traceGlow)" opacity="0.85" />
            <line x1="0" y1="0" x2="-95.1" y2="-30.9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

            <!-- outer nodes -->
            <circle cx="0" cy="-100" r="8" fill="#eaffff" filter="url(#traceGlow)" opacity="0.9" />
            <circle cx="0" cy="-100" r="4" fill="#ffffff" />
            <circle cx="95.1" cy="-30.9" r="8" fill="#eaffff" filter="url(#traceGlow)" opacity="0.9" />
            <circle cx="95.1" cy="-30.9" r="4" fill="#ffffff" />
            <circle cx="58.8" cy="80.9" r="8" fill="#eaffff" filter="url(#traceGlow)" opacity="0.9" />
            <circle cx="58.8" cy="80.9" r="4" fill="#ffffff" />
            <circle cx="-58.8" cy="80.9" r="8" fill="#eaffff" filter="url(#traceGlow)" opacity="0.9" />
            <circle cx="-58.8" cy="80.9" r="4" fill="#ffffff" />
            <circle cx="-95.1" cy="-30.9" r="8" fill="#eaffff" filter="url(#traceGlow)" opacity="0.9" />
            <circle cx="-95.1" cy="-30.9" r="4" fill="#ffffff" />

            <!-- center node -->
            <circle cx="0" cy="0" r="14" fill="#eaffff" filter="url(#traceGlow)" opacity="0.95" />
            <circle cx="0" cy="0" r="7" fill="#ffffff" />
          </g>
        </defs>

        <!-- larger hub, top-left of the card, ~20% dipping into the corner -->
        <use href="#hubIcon" transform="translate(615, 190) scale(0.6)" />

        <!-- smaller hub, right side of the card, between vertical center and bottom, ~20% dipping into the edge -->
        <use href="#hubIcon" transform="translate(1020, 505) scale(0.38)" />
      </svg>
    </template>

    <Form class="relative z-10 flex flex-col gap-3" @submit="onSubmit">
      <InputText
        v-model="state.email"
        :label="t('global.auth.emailLabel')"
        :placeholder="t('global.auth.emailPlaceholder')"
        name="email"
        rules="required"
      />
      <InputPassword
        v-model="state.password"
        :label="t('global.auth.passwordLabel')"
        :placeholder="t('global.auth.passwordPlaceholder')"
        name="password"
        rules="required"
      />

      <button
        type="submit"
        :disabled="loading"
        class="mt-2 w-full rounded-lg bg-[#1d2c66] py-2.5 text-sm font-medium text-white transition hover:bg-[#28398a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loading ? t('global.loading') : t('global.auth.signIn') }}
      </button>
    </Form>
  </AuthCard>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MOCK_DEV_CREDENTIALS, MOCK_DEV_TOKEN, MOCK_DEV_USER } from '~/constants/mockData'

definePageMeta({
  layout: 'blank',
})

useHead({
  title: 'ลงชื่อเข้าใช้',
})

const { t } = useI18n()
const { setAccessToken } = useAuth()
const { success, error } = useNotify()
const userStore = useUserStore()
const { post } = useMutateApi<{ access_token: string, user: User }, { email: string, password: string }>('/auth/login')

const state = reactive({
  email: '',
  password: '',
})

// Guarded so the <Form @submit> (fires on Enter-key) and the submit
// button's click can never both trigger an in-flight login request.
const { loading, guard } = useSubmitGuard()
const onSubmit = guard(async () => {
  try {
    // Dev-only mock login so the app is usable without a running backend.
    if (import.meta.dev && state.email === MOCK_DEV_CREDENTIALS.email && state.password === MOCK_DEV_CREDENTIALS.password) {
      setAccessToken(MOCK_DEV_TOKEN)
      userStore.setUser(MOCK_DEV_USER)
      success(t('global.auth.loginSuccess'))
      await navigateTo('/')
      return
    }

    const response = await post({ email: state.email, password: state.password })
    setAccessToken(response.data.access_token)
    userStore.setUser(response.data.user)
    success(t('global.auth.loginSuccess'))
    await navigateTo('/')
  } catch {
    error(t('global.auth.loginFailed'))
  }
})
</script>
