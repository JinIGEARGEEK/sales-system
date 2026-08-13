type NotifyColor = 'success' | 'error' | 'warning' | 'info'

// Nuxt UI's Toast defaults to a plain white background with only a colored icon/focus-ring —
// no colored-background variant like Alert has. Override per color here (tighter padding/gap
// too, since the default p-4 + gap-2.5 makes every toast taller than it needs to be) so it
// reads as a colored notification at a glance instead of a plain white card.
const TOAST_UI: Record<NotifyColor, { root: string }> = {
  success: { root: 'p-2.5 gap-2 bg-success/20 ring-success/30' },
  error: { root: 'p-2.5 gap-2 bg-error/20 ring-error/30' },
  warning: { root: 'p-2.5 gap-2 bg-warning/20 ring-warning/30' },
  info: { root: 'p-2.5 gap-2 bg-info/20 ring-info/30' },
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
