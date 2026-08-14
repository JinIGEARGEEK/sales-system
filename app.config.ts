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
    modal: {
      slots: {
        overlay: 'fixed inset-0 bg-black/70 backdrop-blur-sm',
        content: 'bg-white/70 backdrop-blur-2xl divide-y divide-white/50 ring-0! shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),inset_0_2px_0_0_rgba(255,255,255,1),inset_2px_0_0_0_rgba(255,255,255,0.8)]!',
      },
    },
  },
})
