<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.companies.detail.projectsHeading') }}</h3>
        <ButtonPrimary v-if="canManageProjects" :label="t('crm.companies.detail.addProject')" icon="material-symbols:add" small @click="openAddProject" />
      </div>
      <div v-if="companyProjects.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.companies.detail.noProjects') }}
      </div>
      <div v-else class="flex flex-col gap-2">
        <button
          v-for="project in companyProjects"
          :key="project.id"
          type="button"
          class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 text-left hover:bg-[var(--color-light-gray-1)]"
          @click="openEditProject(project)"
        >
          <div>
            <p class="text-sm font-medium">{{ project.name }}</p>
            <p class="text-xs text-[var(--color-gray)]">
              {{ project.target_end_date ? t('crm.companies.detail.projectTargetEndDate', { date: dateFormat(project.target_end_date.toISOString()) }) : '-' }}
            </p>
          </div>
          <UBadge color="neutral" variant="subtle">{{ project.status }}</UBadge>
        </button>
      </div>
    </ContainerTemplate>

    <CrmAddProjectModal
      v-model:open="addProjectOpen"
      :project="editingProject"
      :company-id="companyId"
      @submit="onSaveProject"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { dateFormat } = useFormatter()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const projectsStore = useProjectsStore()

const companyId = Number(route.params.id)

// Matches the backend's Project Create RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — internal/routes/routes.go's companies.Post("/:companyId/projects", ...).
const canManageProjects = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))

onMounted(() => {
  projectsStore.fetchForCompany(companyId).catch(notifyApiError)
})

const companyProjects = computed(() => projectsStore.forCompany(companyId))
const {
  open: addProjectOpen,
  editing: editingProject,
  openAdd: openAddProject,
  openEdit: openEditProject,
  onSave: onSaveProject,
} = useProjectModal(companyId, 'crm.companies.detail.addProjectSuccess', 'crm.companies.detail.updateProjectSuccess')
</script>
