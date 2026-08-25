<template>
  <UCard :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.productCategories.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.productCategories.addCategory')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddProductCategory"
        />
      </div>
    </template>

    <TableData
      :columns="productCategoryColumns"
      :rows="productCategoryRows"
      :total="productCategoryRows.length"
      :total-page="1"
      :per-page="productCategoryRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditProductCategory"
      @delete="requestDeactivateProductCategory"
    />
  </UCard>

  <CrmProductCategoryOptionModal
    v-model:open="productCategoryModalOpen"
    :category="editingProductCategory"
    @submit="onSubmitProductCategory"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateProductCategoryOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.productCategories.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateProductCategory"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

defineProps<{
  loading: boolean
}>()

const { t } = useI18n()
const { success, error } = useNotify()
const { toBadge } = useFormatter()
const productCategoryOptionsStore = useProductCategoryOptionsStore()

// ── Product Category options ──────────────────────────────────────

const productCategoryModalOpen = ref(false)
const editingProductCategory = ref<ProductCategoryOption | null>(null)

const openAddProductCategory = () => {
  editingProductCategory.value = null
  productCategoryModalOpen.value = true
}
const onEditProductCategory = (row: ProductCategoryOption) => {
  editingProductCategory.value = productCategoryOptionsStore.items.find(c => c.id === row.id) || null
  productCategoryModalOpen.value = true
}

const onSubmitProductCategory = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingProductCategory.value) {
      await productCategoryOptionsStore.update(editingProductCategory.value.id, payload)
    } else {
      await productCategoryOptionsStore.add(payload)
    }
    success(t('admin.pipelineConfig.productCategories.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateProductCategoryOpen, target: productCategoryTarget, requestDelete: requestDeactivateProductCategory, closeDelete: closeDeactivateProductCategory } = useDeleteConfirm<ProductCategoryOption>()
const confirmDeactivateProductCategory = async () => {
  if (productCategoryTarget.value) {
    try {
      await productCategoryOptionsStore.remove(productCategoryTarget.value.id)
      success(t('admin.pipelineConfig.productCategories.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateProductCategory()
}

const productCategoryRows = computed(() => productCategoryOptionsStore.items.map(category => ({
  ...category,
  statusBadge: category.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const productCategoryColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.productCategories.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.productCategories.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.productCategories.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]
</script>
