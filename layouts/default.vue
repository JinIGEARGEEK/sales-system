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
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-(--color-light-gray-1)"
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
          <div class="flex items-center gap-1">
            <UButton
              v-for="action in footerActions"
              :key="action.icon"
              :icon="action.icon"
              variant="ghost"
              color="neutral"
              size="xs"
              :aria-label="action.ariaLabel"
              @click="drawer = false; action.onClick()"
            />
          </div>
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

      <NuxtLink to="/" class="relative flex h-(--layout-header-height) items-center gap-2 px-4 border-b border-white/15">
        <UIcon name="material-symbols:hub-outline" class="size-6 text-yellow-400" />
        <span class="text-lg font-medium">CRM System</span>
      </NuxtLink>

      <div class="relative z-10 flex-1 overflow-y-auto p-2">
        <nav class="flex flex-col gap-1">
          <template v-for="(menuItem, index) in menuList" :key="index">
            <NuxtLink
              :to="menuItem.path"
              class="sidebar-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-white"
              :class="{ 'is-active font-medium': isActive(menuItem.path) }"
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
          <UAvatar :text="userInitials" size="xs" />
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-white truncate">{{ userDisplayName }}</div>
            <div class="text-[11px] text-white/60 truncate">{{ email }}</div>
          </div>
        </div>
        <div class="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-white">
          <SwitchLang glass />
          <div class="flex items-center gap-1">
            <UButton
              v-for="action in footerActions"
              :key="action.icon"
              :icon="action.icon"
              variant="ghost"
              color="neutral"
              size="xs"
              :class="action.danger
                ? 'text-red-300/80 hover:bg-red-500/15 hover:text-red-300 hover:shadow-[0_0_10px_rgba(248,113,113,0.35)] focus-visible:bg-red-500/15 focus-visible:text-red-300'
                : 'text-white/70 hover:bg-white/10 hover:text-white'"
              :aria-label="action.ariaLabel"
              @click="action.onClick"
            />
          </div>
        </div>
      </div>
    </aside>

    <main ref="mainRef" class="flex-1 overflow-y-auto bg-[var(--color-content-bg)]/60">
      <div ref="headerRef" class="sticky top-0 z-10 hidden h-(--layout-header-height) items-center justify-between gap-4 overflow-hidden border-b border-white/15 bg-(--color-sidebar-bg)/90 px-5 backdrop-blur-2xl md:flex">
        <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent" />
        <div class="relative w-full max-w-md">
          <CrmGlobalSearch />
        </div>
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-x-2"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0 translate-x-2"
        >
          <p v-if="showTitleInHeader" class="truncate text-sm font-bold text-white">
            {{ currentPageTitle }}
          </p>
        </Transition>
      </div>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const drawer = ref(false)
const { logout } = useAuth()
const { hasRole } = useRole()
const { first_name, last_name, email } = storeToRefs(useUserStore())

const userDisplayName = computed(() => `${first_name.value} ${last_name.value}`.trim() || t('layout.user.defaultName'))
const userInitials = computed(() => `${first_name.value[0] || ''}${last_name.value[0] || ''}`.toUpperCase() || 'AD')

interface MenuItem {
  icon: string
  label: string
  path: string
  separator: boolean
  // Omitted = every role can see it. Only sections the backend actually
  // restricts (internal/routes/routes.go's RequireRoles) should set this —
  // everything else is open to any authenticated role at the route level.
  roles?: Role[]
}

const menuList = computed(() => {
  const items: MenuItem[] = [
    { icon: 'material-symbols:monitoring', label: t('layout.nav.salesDashboard'), path: '/', separator: false },
    { icon: 'material-symbols:person-search-outline', label: t('layout.nav.leads'), path: '/crm/leads', separator: false },
    { icon: 'material-symbols:handshake-outline', label: t('layout.nav.deals'), path: '/crm/deals', separator: false },
    { icon: 'material-symbols:engineering-outline', label: t('layout.nav.projects'), path: '/crm/projects', separator: false },
    { icon: 'material-symbols:checklist', label: t('layout.nav.tasks'), path: '/crm/tasks', separator: true },
    { icon: 'material-symbols:apartment-outline', label: t('layout.nav.companies'), path: '/crm/companies', separator: false },
    { icon: 'material-symbols:contacts-outline', label: t('layout.nav.contacts'), path: '/crm/contacts', separator: false },
    { icon: 'material-symbols:sell-outline', label: t('layout.nav.tags'), path: '/crm/tags', separator: false },
    { icon: 'material-symbols:bar-chart-outline', label: t('layout.nav.reports'), path: '/crm/reports', separator: true, roles: ['Admin', 'Sales Manager'] },
    { icon: 'material-symbols:history', label: t('layout.nav.adminActivities'), path: '/admin/activity-log', separator: false, roles: ['Admin'] },
    { icon: 'material-symbols:group-outline', label: t('layout.nav.customers'), path: '/admin/users', separator: false, roles: ['Admin'] },
    { icon: 'material-symbols:tune', label: t('layout.nav.pipelineConfig'), path: '/admin/pipeline-config', separator: false, roles: ['Admin'] },
    { icon: 'material-symbols:delete-outline', label: t('layout.nav.trash'), path: '/admin/trash', separator: false, roles: ['Admin', 'Sales Manager'] },
  ]
  return items.filter(item => !item.roles || hasRole(...item.roles))
})

const footerActions = computed(() => [
  { icon: 'material-symbols:lock-reset', ariaLabel: t('layout.changePassword'), onClick: () => navigateTo('/account/change-password'), danger: false },
  { icon: 'material-symbols:logout', ariaLabel: t('layout.logout'), onClick: logout, danger: true },
])

// Shows the current page's <h2> title in the header once it scrolls up
// behind the sticky search bar, so the page context isn't lost while scrolling.
const mainRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const currentPageTitle = ref('')
const showTitleInHeader = ref(false)
let titleObserver: IntersectionObserver | null = null

const observePageTitle = () => {
  titleObserver?.disconnect()
  showTitleInHeader.value = false

  nextTick(() => {
    const mainEl = mainRef.value
    const headerEl = headerRef.value
    const titleEl = mainEl?.querySelector('h2')
    if (!mainEl || !headerEl || !titleEl) {
      currentPageTitle.value = ''
      return
    }

    currentPageTitle.value = titleEl.textContent?.trim() ?? ''

    titleObserver = new IntersectionObserver(
      ([entry]) => { showTitleInHeader.value = !entry.isIntersecting },
      { root: mainEl, rootMargin: `-${headerEl.offsetHeight}px 0px 0px 0px`, threshold: 0 },
    )
    titleObserver.observe(titleEl)
  })
}

onMounted(observePageTitle)
watch(() => route.fullPath, observePageTitle)
onUnmounted(() => titleObserver?.disconnect())

const isActive = (path: string) => {
  if (path === '/admin/activity-log' || path === '/') return route.path === path
  return route.path.startsWith(path)
}
</script>

<style scoped>
/*
 * Sidebar nav item glow: a 1px yellow-to-blue gradient ring drawn via a
 * mask-clipped pseudo-element (border-color can't take a gradient), plus a
 * soft glass tint + glow on hover/focus/active. Kept scoped to this layout
 * since it's the only place this treatment is used.
 */
.sidebar-nav-link {
  position: relative;
  transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.sidebar-nav-link::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(96, 165, 250, 0.9));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.sidebar-nav-link:hover,
.sidebar-nav-link:focus-visible {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.14), rgba(96, 165, 250, 0.14));
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.25), 0 0 18px rgba(96, 165, 250, 0.25);
}

.sidebar-nav-link:hover::before,
.sidebar-nav-link:focus-visible::before,
.sidebar-nav-link.is-active::before {
  opacity: 1;
}

.sidebar-nav-link.is-active {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.1), rgba(96, 165, 250, 0.1));
}

.sidebar-nav-link:focus-visible {
  outline: none;
}
</style>
