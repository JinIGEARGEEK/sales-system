// Shared prop definitions for the Input/* form field wrappers (Text, Password,
// Select, Textarea, DatePicker, DateRangePicker). Every wrapper re-declares its
// own `name`/`rules`/`label`/`dataCy`/`placeholder`/`ariaLabel` (rather than relying on
// Vue's $attrs fallthrough) because each one explicitly forwards these to the
// underlying `InputFormField`/`Field` — spread this into `defineProps({ ...})`
// to avoid redeclaring the identical boilerplate in every wrapper.
//
// `modelValue` is deliberately NOT included here: its type/default differs per
// wrapper (string, string|number, or an object for DateRangePicker), so each
// component still declares its own.
export function useInputBaseProps() {
  return {
    name: {
      type: String,
      default: '',
    },
    rules: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    dataCy: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    // Accessible name for a field rendered without a visible `label` (e.g. a
    // compact filter bar). Resolve it with `inputAriaLabel()` below rather
    // than binding it directly, so the placeholder fallback stays consistent.
    ariaLabel: {
      type: String,
      default: '',
    },
  }
}

// The `aria-label` an Input/* wrapper puts on its Nuxt UI primitive: an
// explicit `ariaLabel` wins; otherwise nothing when a visible <label for>
// already names the field (a duplicate aria-label would override it), and
// the placeholder (pass the wrapper's effective one when it has a built-in
// default, e.g. DatePicker) as a last resort.
export function inputAriaLabel(
  props: { ariaLabel?: string, label?: string, placeholder?: string },
  placeholder: string | undefined = props.placeholder,
): string | undefined {
  if (props.ariaLabel) return props.ariaLabel
  if (props.label) return undefined
  return placeholder || undefined
}
