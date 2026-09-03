export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      secondary: 'secondary',
    },
    tabs: {
      slots: {
        // `shadow-xl` here used to spread a large soft shadow well past the
        // pill's own bounds — on a thin tab strip (unlike a full UCard,
        // which has real body height to anchor a shadow that size against)
        // it read as a stray hazy gray box sitting under the tabs rather
        // than a shadow. `shadow-sm` keeps the glass-pill look grounded
        // without that artifact — see design-system.md §2.5 if you touch
        // this again.
        list: 'bg-white/65 backdrop-blur-2xl border border-white/90 divide-x divide-white/70 shadow-sm',
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
