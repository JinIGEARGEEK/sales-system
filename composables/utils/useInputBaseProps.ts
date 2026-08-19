// Shared prop definitions for the Input/* form field wrappers (Text, Password,
// Select, Textarea, DatePicker, DateRangePicker). Every wrapper re-declares its
// own `name`/`rules`/`label`/`dataCy`/`placeholder` (rather than relying on
// Vue's $attrs fallthrough) because each one explicitly forwards these to the
// underlying `InputFormField`/`Field` — spread this into `defineProps({ ...})`
// to avoid redeclaring the identical boilerplate in every wrapper.
//
// `modelValue` is deliberately NOT included here: its type/default differs per
// wrapper (string, string|number, or an object for DateRangePicker), so each
// component still declares its own.
export function useInputBaseProps(options?: { placeholder?: string }) {
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
      default: options?.placeholder ?? '',
    },
  }
}
