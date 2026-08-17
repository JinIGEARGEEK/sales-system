export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      secondary: 'secondary',
    },
    tabs: {
      slots: {
        list: 'bg-white/65 backdrop-blur-2xl border border-white/90 divide-x divide-white/70 shadow-xl',
      },
    },
    card: {
      slots: {
        header: 'p-3 sm:p-4',
        body: 'p-3 sm:p-4',
        footer: 'p-3 sm:p-4',
      },
    },
    modal: {
      slots: {
        overlay: 'fixed inset-0 bg-black/70 backdrop-blur-sm',
        content: 'bg-white/70 backdrop-blur-2xl divide-y divide-white/50 ring-0! shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),inset_0_2px_0_0_rgba(255,255,255,1),inset_2px_0_0_0_rgba(255,255,255,0.8)]!',
      },
    },
    /*
     * Default unchecked box is just a faint `ring-accented` with no fill —
     * invisible against this app's translucent glass surfaces (modals,
     * tabs). Give it a solid white fill plus the app's card-border color so
     * it stays visible on any background, glass or opaque.
     */
    checkbox: {
      slots: {
        base: 'bg-white ring-(--color-gray)',
      },
    },
  },
})
