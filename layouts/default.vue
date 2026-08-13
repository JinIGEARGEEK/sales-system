<template>
  <div class="flex h-screen bg-linear-to-br from-[var(--color-app-shell-gradient-from)] via-[var(--color-app-shell-gradient-via)] to-[var(--color-app-shell-gradient-to)]">
    <USlideover v-model:open="drawer" side="left" class="md:hidden">
      <template #header>
        <NuxtLink to="/" class="flex items-center gap-2" @click="drawer = false">
          <UIcon name="material-symbols:hub-outline" class="size-5 text-yellow-400" />
          <span class="text-lg font-medium">CRM System</span>
        </NuxtLink>
      </template>
      <template #body>
        <nav class="flex flex-col gap-1 p-2">
          <template v-for="(menuItem, index) in menuList" :key="index">
            <NuxtLink
              :to="menuItem.path"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-light-gray-1)]"
              :class="{ 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]': isActive(menuItem.path) }"
              @click="drawer = false"
            >
              <UIcon :name="menuItem.icon" class="size-5" />
              <span>{{ menuItem.label }}</span>
            </NuxtLink>
            <USeparator v-if="menuItem.separator" class="my-1" />
          </template>
        </nav>
      </template>
      <template #footer>
        <div class="flex items-center justify-between px-2">
          <SwitchLang />
          <UButton
            icon="material-symbols:logout"
            variant="ghost"
            color="neutral"
            size="xs"
            :aria-label="t('layout.logout')"
            @click="logout"
          />
        </div>
      </template>
    </USlideover>

    <UButton
      icon="material-symbols:menu"
      variant="solid"
      color="neutral"
      size="sm"
      class="fixed top-3 left-3 z-20 md:hidden"
      @click="drawer = true"
    />

    <aside class="relative hidden overflow-hidden border-r border-white/15 bg-[var(--color-sidebar-bg)]/90 text-white backdrop-blur-2xl md:flex md:w-44 md:flex-col">
      <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent" />

      <NuxtLink to="/" class="relative flex h-14 items-center gap-2 px-4 border-b border-white/15">
        <UIcon name="material-symbols:hub-outline" class="size-6 text-yellow-400" />
        <span class="text-lg font-medium">CRM System</span>
      </NuxtLink>

      <div class="relative z-10 flex-1 overflow-y-auto p-2">
        <nav class="flex flex-col gap-1">
          <template v-for="(menuItem, index) in menuList" :key="index">
            <NuxtLink
              :to="menuItem.path"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10"
              :class="{ 'bg-white/10 font-medium': isActive(menuItem.path) }"
            >
              <UIcon :name="menuItem.icon" class="size-5 shrink-0" />
              <span class="truncate">{{ menuItem.label }}</span>
            </NuxtLink>
            <USeparator v-if="menuItem.separator" class="my-1 opacity-10" />
          </template>
        </nav>
      </div>

      <div class="relative z-10 border-t border-white/10 p-2.5">
        <div class="flex items-center gap-2">
          <UAvatar text="AD" size="xs" />
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-white truncate">{{ t('layout.user.defaultName') }}</div>
            <div class="text-[11px] text-white/60 truncate">admin@example.com</div>
          </div>
        </div>
        <div class="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-white">
          <SwitchLang />
          <UButton
            icon="material-symbols:logout"
            variant="ghost"
            color="neutral"
            size="xs"
            class="text-white/70 hover:bg-white/10 hover:text-white"
            :aria-label="t('layout.logout')"
            @click="logout"
          />
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto bg-[var(--color-content-bg)]">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const drawer = ref(false)
const { removeAccessToken } = useAuth()
const userStore = useUserStore()

const logout = () => {
  removeAccessToken()
  userStore.$reset()
  navigateTo('/login')
}

const menuList = computed(() => [
  { icon: 'material-symbols:monitoring', label: t('layout.nav.salesDashboard'), path: '/', separator: false },
  { icon: 'material-symbols:person-search-outline', label: t('layout.nav.leads'), path: '/crm/leads', separator: false },
  { icon: 'material-symbols:handshake-outline', label: t('layout.nav.deals'), path: '/crm/deals', separator: false },
  { icon: 'material-symbols:apartment-outline', label: t('layout.nav.companies'), path: '/crm/companies', separator: false },
  { icon: 'material-symbols:contacts-outline', label: t('layout.nav.contacts'), path: '/crm/contacts', separator: false },
  { icon: 'material-symbols:sell-outline', label: t('layout.nav.tags'), path: '/crm/tags', separator: true },
  { icon: 'material-symbols:history', label: t('layout.nav.adminActivities'), path: '/admin/activity-log', separator: false },
  { icon: 'material-symbols:group-outline', label: t('layout.nav.customers'), path: '/admin/users', separator: false },
])

const isActive = (path: string) => {
  if (path === '/admin/activity-log' || path === '/') return route.path === path
  return route.path.startsWith(path)
}
</script>
