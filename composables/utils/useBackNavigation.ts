/**
 * "Back"/"Cancel" handler for detail and create pages.
 *
 * Detail pages hardcode their back-arrow to the entity's list page, which
 * strands the user on that list when they actually arrived via a cross-link
 * from another detail page (e.g. Deal detail -> Company detail). This
 * returns to the real previous in-app page when one exists (via Vue
 * Router's history state), and only falls back to the given list path when
 * there isn't one — direct link, page refresh, or opened in a new tab.
 */
export const useBackNavigation = (fallback: string) => {
  const router = useRouter()

  return () => {
    const state = window.history.state as { back?: string | null } | null
    if (state?.back) {
      router.back()
    } else {
      navigateTo(fallback)
    }
  }
}
