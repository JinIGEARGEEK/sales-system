<template>
  <div class="p-5">
    <div v-if="tag">
      <div class="mb-4 flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="goBack()"
        />
        <h2 class="text-xl font-black">{{ t('crm.tags.detail.heading') }}</h2>
      </div>

      <ContainerTemplate>
        <Form @submit="onSave">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputText v-model="form.name" :label="t('crm.tags.detail.name')" name="name" rules="required" />
            <InputSelect
              v-model="form.category"
              :options="TAG_CATEGORY_OPTIONS"
              :label="t('crm.tags.detail.category')"
              name="category"
              rules="required"
            />
            <InputSelect
              v-model="form.status"
              :options="TAG_STATUS_FORM_OPTIONS"
              :label="t('crm.tags.detail.status')"
              name="status"
              rules="required"
            />
            <div class="md:col-span-2">
              <InputTextarea v-model="form.description" :label="t('crm.tags.detail.description')" name="description" rules="required" />
            </div>
          </div>

          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('crm.tags.detail.saveChanges')" type="submit" :loading="loading" />
            <ButtonPrimary :label="t('crm.tags.create.cancel')" cancel @click="goBack()" />
          </div>
        </Form>
      </ContainerTemplate>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.tags.detail.tagNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TAG_CATEGORY_OPTIONS, TAG_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.tags.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const tagsStore = useTagsStore()
const goBack = useBackNavigation('/crm/tags')

onMounted(() => {
  if (tagsStore.items.length === 0) tagsStore.fetchAll().catch(notifyApiError)
})

const tagId = Number(route.params.id)
const tag = computed(() => tagsStore.items.find(tg => tg.id === tagId))

const form = reactive({
  name: tag.value?.name || '',
  category: tag.value?.category || '',
  status: tag.value?.status || 'active',
  description: tag.value?.description || '',
})

// Tag loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time.
watch(tag, (value) => {
  if (!value) return
  form.name = value.name
  form.category = value.category
  form.status = value.status
  form.description = value.description
}, { immediate: true })

const { loading, guard } = useSubmitGuard()

const onSave = guard(async () => {
  if (tag.value) {
    await tagsStore.update(tag.value.id, {
      name: form.name,
      category: form.category as TagCategory,
      status: form.status as TagStatus,
      description: form.description,
    })
  }
  success(t('crm.tags.detail.updateSuccess'))
  navigateTo('/crm/tags')
})
</script>
