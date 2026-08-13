export const useTablePagination = (getTotal: () => number, initialPerPage = 10) => {
  const page = ref(1)
  const perPage = ref(initialPerPage)

  const totalPage = computed(() => Math.max(1, Math.ceil(getTotal() / perPage.value)))

  watch(getTotal, () => {
    page.value = 1
  })

  const onChangePage = (value: number) => {
    page.value = value
  }

  const onChangePerPage = (value: number) => {
    page.value = 1
    perPage.value = value
  }

  return {
    page,
    perPage,
    totalPage,
    onChangePage,
    onChangePerPage,
  }
}
