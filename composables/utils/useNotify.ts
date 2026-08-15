type NotifyColor = 'success' | 'error' | 'warning' | 'info'

// Nuxt UI's Toast defaults to a plain white background with only a colored icon/focus-ring —
// no colored-background variant like Alert has. Override per color here (tighter padding/gap
// too, since the default p-4 + gap-2.5 makes every toast taller than it needs to be) so it
// reads as a colored notification at a glance instead of a plain white card. Solid (not
// translucent) on purpose — toasts render top-right over whatever's behind them (the app
// content, a dark sticky header, anything), so contrast can't depend on what's underneath.
// The `bg-*`/`text-*` classes per color must stay literal below — Tailwind's scanner needs
// the full class text present in the file, not built from a template.
const TOAST_BASE_UI = 'p-2.5 gap-2 shadow-xl'
const TOAST_TEXT_UI = { title: 'text-white', icon: 'text-white', close: 'text-white hover:bg-white/20' }

const TOAST_UI: Record<NotifyColor, { root: string, title: string, icon: string, close: string }> = {
  success: { root: `${TOAST_BASE_UI} bg-success`, ...TOAST_TEXT_UI },
  error: { root: `${TOAST_BASE_UI} bg-error`, ...TOAST_TEXT_UI },
  warning: { root: `${TOAST_BASE_UI} bg-warning`, ...TOAST_TEXT_UI },
  info: { root: `${TOAST_BASE_UI} bg-info`, ...TOAST_TEXT_UI },
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
