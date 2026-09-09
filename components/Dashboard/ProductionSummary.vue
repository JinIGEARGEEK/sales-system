<template>
  <div class="mb-8">
    <h3 class="mb-3 flex items-center justify-between border-b border-[var(--color-light-gray-2)] pb-2">
      <span class="text-sm font-semibold text-[var(--color-black)]">{{ t('crm.dashboard.sectionMyProjects') }}</span>
      <NuxtLink to="/crm/projects" class="text-xs font-medium text-[var(--color-primary)] hover:underline">
        {{ t('crm.dashboard.viewAllProjects') }}
      </NuxtLink>
    </h3>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <CrmStatCard
        :label="t('crm.dashboard.openProjects')"
        icon="material-symbols:engineering-outline"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
        to="/crm/projects"
      >
        {{ openProjects.length }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.notStartedProjects')"
        icon="material-symbols:hourglass-empty"
        icon-class="text-[var(--color-warning-hover)]"
        icon-bg-class="bg-[var(--color-warning-hover)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
        to="/crm/projects?status=Not+Started"
      >
        {{ notStartedCount }}
      </CrmStatCard>
    </div>

    <UCard class="mt-4 ring-[var(--color-card-border)]">
      <template #header>
        <h3 class="text-lg font-medium">{{ t('crm.dashboard.projectsNeedingUpdate') }}</h3>
      </template>
      <div v-if="openProjects.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.dashboard.noOpenProjects') }}
      </div>
      <div v-else class="flex flex-col gap-2">
        <NuxtLink
          v-for="project in openProjects"
          :key="project.id"
          :to="`/crm/projects?edit=${project.id}`"
          class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
        >
          <div>
            <p class="text-sm font-medium">{{ project.name }}</p>
            <p class="text-xs text-[var(--color-gray)]">{{ project.company_name }}</p>
          </div>
          <UBadge color="neutral" variant="subtle">{{ project.status }}</UBadge>
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  projects: Project[]
}>()

// "Open" = still Production's job to touch — the two terminal statuses
// (Completed/Cancelled) are excluded, matching AddProjectModal's own
// productionEditor mode. Project has no updated_at to sort by staleness, so
// this sorts by id ascending (oldest-created first) as the closest available
// proxy — a Project that's been open longest tends to be the one most
// overdue for a status update.
const openProjects = computed(() => props.projects
  .filter(p => p.status !== 'Completed' && p.status !== 'Cancelled')
  .sort((a, b) => a.id - b.id)
  .slice(0, 10))

const notStartedCount = computed(() => props.projects.filter(p => p.status === 'Not Started').length)
</script>
