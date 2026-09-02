// A minimal confirm-before-action gate for a single, already-known record
// (e.g. the record a detail page is already showing) — no target object to
// track, unlike useDeleteConfirm's list-row case where each row needs to be
// captured before the modal opens.
export const useConfirmGate = () => {
  const open = ref(false)

  const request = () => {
    open.value = true
  }

  const close = () => {
    open.value = false
  }

  return {
    open,
    request,
    close,
  }
}
