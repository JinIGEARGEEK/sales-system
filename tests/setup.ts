import { vi, expect } from 'vitest'
import { config } from '@vue/test-utils'
import { Form, Field, ErrorMessage } from 'vee-validate'

vi.resetModules()

config.global.components = {
  Form,
  Field,
  ErrorMessage,
}

// Normalize randomly generated ID
expect.addSnapshotSerializer({
  test: val => typeof val === 'string' && (
    /<[^>]+\sid="[^"]+"/i.test(val) ||
    /<[^>]+\saria-controls="[^"]+"/i.test(val) ||
    /<[^>]+\sfor="[^"]+"/i.test(val)
  ),
  print: (val) => {
    return (val as string)
      .replace(/(\s)id="[^"]+"/gi, '$1id="[NORMALIZED-ID]"')
      .replace(/(\s)aria-controls="[^"]+"/gi, '$1aria-controls="[NORMALIZED-ARIA-CONTROLS]"')
      .replace(/(\s)for="[^"]+"/gi, '$1for="[NORMALIZED-FOR]"')
  },
})
