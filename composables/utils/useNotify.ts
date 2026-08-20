type NotifyColor = 'success' | 'error' | 'warning' | 'info'

// Nuxt UI's Toast defaults to a plain white background with only a colored icon/focus-ring —
// no colored-background variant like Alert has. Override per color here (tighter padding/gap
// too, since the default p-4 + gap-2.5 makes every toast taller than it needs to be) so it
// reads as a colored notification at a glance instead of a plain white card.
//
// Uses the app's own pale `-toast-bg` fills + saturated `-toast` accent border/icon (the same
// "light tint card + colored left border + dark text" language as UAlert elsewhere, e.g.
// pages/index.vue's "no deals match" banner) rather than Nuxt UI's stock bg-success/bg-error/
// etc. utilities — those read as generic, fully-saturated blocks with white text that don't
// match this app's pale/glassy visual language anywhere else (stat tiles, badges, form errors
// are all pale tints + saturated accent, never a solid colored card). Still fully opaque
// (`-toast-bg` is a solid hex, not a translucent tint) so contrast doesn't depend on whatever
// the toast happens to render over (page content, a dark sticky header, etc.) — same
// contrast-independence goal as before, just via an on-brand solid instead of Nuxt UI's stock one.
// The `bg-[var(--color-*-toast-bg)]` classes per color must stay literal below — Tailwind's
// scanner needs the full class text present in the file, not built from a template.
const TOAST_BASE_UI = 'p-2.5 gap-2 shadow-xl border-l-4'
const TOAST_TITLE_UI = { title: 'text-[var(--color-black)]', close: 'text-[var(--color-gray)] hover:bg-[var(--color-light-gray-1)]' }

const TOAST_UI: Record<NotifyColor, { root: string, title: string, icon: string, close: string }> = {
  success: { root: `${TOAST_BASE_UI} bg-[var(--color-success-toast-bg)] border-l-[var(--color-success-toast)]`, icon: 'text-[var(--color-success-toast)]', ...TOAST_TITLE_UI },
  error: { root: `${TOAST_BASE_UI} bg-[var(--color-danger-toast-bg)] border-l-[var(--color-danger-toast)]`, icon: 'text-[var(--color-danger-toast)]', ...TOAST_TITLE_UI },
  warning: { root: `${TOAST_BASE_UI} bg-[var(--color-warning-toast-bg)] border-l-[var(--color-warning-toast)]`, icon: 'text-[var(--color-warning-toast)]', ...TOAST_TITLE_UI },
  info: { root: `${TOAST_BASE_UI} bg-[var(--color-info-toast-bg)] border-l-[var(--color-info-toast)]`, icon: 'text-[var(--color-info-toast)]', ...TOAST_TITLE_UI },
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
