export default <T>() => {
  const open = ref(false)
  const target = ref<T | null>(null) as Ref<T | null>

  const requestDelete = (item: T) => {
    target.value = item
    open.value = true
  }

  const closeDelete = () => {
    open.value = false
    target.value = null
  }

  return {
    open,
    target,
    requestDelete,
    closeDelete,
  }
}
