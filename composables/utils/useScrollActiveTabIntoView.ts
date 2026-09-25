import type { Ref, WatchSource } from 'vue'

// Horizontally-scrolling tab strips (`overflow-x-auto scrollbar-hide` around a
// `w-max` UTabs list, e.g. a Deal's 7 tabs) open at scrollLeft 0 on mobile —
// so arriving on a later tab (a deep link to /crm/deals/:id/payments, or a
// refresh while on it) leaves the active tab scrolled out of sight. This
// scrolls the active trigger into view on mount and whenever `activeTab`
// changes. Only the strip's own horizontal scroll moves: the target offset is
// computed and applied to the container directly rather than via
// Element.scrollIntoView, which would also scroll the page vertically.
export const useScrollActiveTabIntoView = (container: Ref<HTMLElement | null | undefined>, activeTab: WatchSource<unknown>) => {
  const scrollToActive = (behavior: ScrollBehavior) => {
    const el = container.value
    if (!el || el.scrollWidth <= el.clientWidth) return
    const active = el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]')
    if (!active) return
    const elRect = el.getBoundingClientRect()
    const tabRect = active.getBoundingClientRect()
    const padding = 16
    if (tabRect.left < elRect.left) {
      el.scrollTo({ left: el.scrollLeft - (elRect.left - tabRect.left) - padding, behavior })
    } else if (tabRect.right > elRect.right) {
      el.scrollTo({ left: el.scrollLeft + (tabRect.right - elRect.right) + padding, behavior })
    }
  }

  onMounted(() => nextTick(() => scrollToActive('auto')))
  // `flush: 'post'` so the new tab's aria-selected state has rendered first;
  // also re-runs when the container itself mounts later (e.g. behind a
  // `v-if` waiting on the record to load).
  watch([activeTab, container], () => nextTick(() => scrollToActive('smooth')), { flush: 'post' })
}
