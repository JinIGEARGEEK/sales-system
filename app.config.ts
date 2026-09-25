export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      secondary: 'secondary',
    },
    /*
     * Nuxt UI's own built-in icons (modal/toast close, select chevrons,
     * calendar arrows, loading spinners, ...) default to Lucide. Override
     * every key of Nuxt UI 3's `ui.icons` with the Material Symbols
     * equivalent so the whole app renders one icon set (CLAUDE.md rule) and
     * nothing needs the Lucide collection at all. If a Nuxt UI upgrade adds a
     * new key, add it here too (see node_modules/@nuxt/ui's default `icons`).
     */
    icons: {
      arrowLeft: 'material-symbols:arrow-back',
      arrowRight: 'material-symbols:arrow-forward',
      check: 'material-symbols:check',
      chevronDoubleLeft: 'material-symbols:keyboard-double-arrow-left',
      chevronDoubleRight: 'material-symbols:keyboard-double-arrow-right',
      chevronDown: 'material-symbols:keyboard-arrow-down',
      chevronLeft: 'material-symbols:keyboard-arrow-left',
      chevronRight: 'material-symbols:keyboard-arrow-right',
      chevronUp: 'material-symbols:keyboard-arrow-up',
      close: 'material-symbols:close',
      ellipsis: 'material-symbols:more-horiz',
      external: 'material-symbols:arrow-outward',
      file: 'material-symbols:draft-outline',
      folder: 'material-symbols:folder-outline',
      folderOpen: 'material-symbols:folder-open-outline',
      loading: 'material-symbols:progress-activity',
      minus: 'material-symbols:remove',
      plus: 'material-symbols:add',
      search: 'material-symbols:search',
      upload: 'material-symbols:upload',
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
        // Nuxt UI's default only transitions the indicator's translate/width
        // (not its color) and gives the trigger's text-color a separate,
        // untimed `transition-colors` — the slide and the color/text change
        // finish at visibly different times. Widen the indicator's
        // transition to include background-color and match both durations
        // so the pill's movement and color settle together.
        indicator: 'transition-[translate,width,background-color] duration-300 ease-out',
        trigger: 'transition-colors duration-300 ease-out',
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
