type NotifyColor = 'success' | 'error' | 'warning' | 'info'

// Nuxt UI's Toast defaults to a plain white background with only a colored icon/focus-ring —
// no colored-background variant like Alert has. Override per color here (tighter padding/gap
// too, since the default p-4 + gap-2.5 makes every toast taller than it needs to be) so it
// reads as a colored notification at a glance instead of a plain white card. Glass classes are
// shared via this base string, but the `bg-*/20` class per color must stay a literal below —
// Tailwind's scanner needs the full class text present in the file, not built from a template.
const TOAST_GLASS_UI = 'p-2.5 gap-2 backdrop-blur-2xl ring-1 ring-white/40 ring-inset shadow-xl'

const TOAST_UI: Record<NotifyColor, { root: string }> = {
  success: { root: `${TOAST_GLASS_UI} bg-success/20` },
  error: { root: `${TOAST_GLASS_UI} bg-error/20` },
  warning: { root: `${TOAST_GLASS_UI} bg-warning/20` },
  info: { root: `${TOAST_GLASS_UI} bg-info/20` },
}

export const useNotify = () => {
  const toast = useToast()

  const show = (message: string, color: NotifyColor) => {
    toast.add({ title: message, color, ui: TOAST_UI[color] })
  }

  return {
    notify: (options: {
      message: string
      type?: NotifyColor
    }) => {
      show(options.message, options.type ?? 'info')
    },
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
    warning: (message: string) => show(message, 'warning'),
  }
}
