<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI" data-cy="weekly-digest-card">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="flex items-center gap-2 text-base font-semibold">
          <UIcon name="material-symbols:mark-email-read-outline" class="size-5 text-(--color-gray)" />
          {{ t('admin.pipelineConfig.weeklyDigest.heading') }}
        </h3>
        <div class="flex gap-2">
          <ButtonPrimary
            outline
            small
            fit-content
            icon="material-symbols:visibility-outline"
            :label="t('admin.pipelineConfig.weeklyDigest.preview')"
            :loading="previewLoading"
            data-cy="weekly-digest-preview"
            @click="openPreview"
          />
          <ButtonPrimary
            outline
            small
            fit-content
            icon="material-symbols:send-outline"
            :label="t('admin.pipelineConfig.weeklyDigest.sendTest')"
            :loading="testLoading"
            :disabled="!smtpConfigured"
            data-cy="weekly-digest-send-test"
            @click="sendTest"
          />
        </div>
      </div>
    </template>

    <UCheckbox
      :model-value="appSettings?.weekly_digest_enabled ?? true"
      :label="t('admin.pipelineConfig.weeklyDigest.enabledLabel')"
      :disabled="!appSettings || saving"
      data-cy="weekly-digest-enabled"
      @update:model-value="onToggle(Boolean($event))"
    />
    <p class="mt-1 text-xs text-(--color-gray)">{{ t('admin.pipelineConfig.weeklyDigest.help') }}</p>
    <p v-if="!smtpConfigured" class="mt-2 flex items-center gap-1 text-xs text-(--color-warning-hover)">
      <UIcon name="material-symbols:warning-outline" class="size-4 shrink-0" />
      {{ t('admin.pipelineConfig.weeklyDigest.smtpMissing') }}
    </p>
    <p class="mt-2 text-xs text-(--color-gray)">
      {{ appSettings?.last_weekly_digest_at
        ? t('admin.pipelineConfig.weeklyDigest.lastSent', { date: dateTimeFormat(appSettings.last_weekly_digest_at) })
        : t('admin.pipelineConfig.weeklyDigest.neverSent') }}
    </p>
  </UCard>

  <!-- Titled, so Nuxt UI adds its own labelled close (×) button and the
  dialog gets an accessible name. -->
  <UModal v-model:open="previewOpen" :title="t('admin.pipelineConfig.weeklyDigest.previewTitle')" :ui="{ content: 'max-w-3xl' }">
    <template #body>
      <div v-if="preview" class="flex flex-col gap-2" data-cy="weekly-digest-preview-body">
        <p class="font-medium">{{ preview.subject }}</p>
        <p class="text-xs text-(--color-gray)">
          {{ t('admin.pipelineConfig.weeklyDigest.previewWeek', { from: dateFormat(preview.week_from), to: dateFormat(preview.week_to) }) }}
          ·
          {{ preview.recipients.length
            ? t('admin.pipelineConfig.weeklyDigest.recipients', { list: preview.recipients.join(', ') })
            : t('admin.pipelineConfig.weeklyDigest.noRecipients') }}
        </p>
        <pre class="max-h-[60vh] overflow-auto rounded-lg border border-(--color-card-border) bg-(--color-light-gray-1) p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ preview.body }}</pre>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

// The weekly Overview Pipeline email (FR-CRM-123): on/off switch, when it
// last went out, and a preview / test send so an Admin can see exactly what
// Admins and Sales Managers receive each Monday.
const { t } = useI18n()
const { success, error } = useNotify()
const { dateFormat, dateTimeFormat } = useFormatter()
const appSettingsStore = useAppSettingsStore()
const { settings: appSettings } = storeToRefs(appSettingsStore)
const smtpConfigured = computed(() => appSettings.value?.smtp_configured ?? false)

const saving = ref(false)
const onToggle = async (enabled: boolean) => {
  const current = appSettings.value
  if (!current) return
  saving.value = true
  try {
    // The settings PATCH always requires the two revenue figures; the rest
    // are optional, so send them as they are plus the flag.
    await appSettingsStore.update({
      quarterly_sales_target: current.quarterly_sales_target,
      annual_revenue_goal: current.annual_revenue_goal,
      weekly_digest_enabled: enabled,
    })
    success(t('admin.pipelineConfig.weeklyDigest.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    saving.value = false
  }
}

const previewOpen = ref(false)
const previewLoading = ref(false)
const preview = ref<WeeklyDigestPreview | null>(null)
const openPreview = async () => {
  previewLoading.value = true
  try {
    preview.value = await appSettingsStore.previewWeeklyDigest()
    previewOpen.value = true
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    previewLoading.value = false
  }
}

const testLoading = ref(false)
const sendTest = async () => {
  testLoading.value = true
  try {
    const email = await appSettingsStore.sendWeeklyDigestTest()
    success(t('admin.pipelineConfig.weeklyDigest.testSent', { email }))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    testLoading.value = false
  }
}
</script>
