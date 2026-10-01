import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CommonInputText from '~/components/Input/Text.vue'

describe('InputText Component Test', () => {
  // Was skipped under @nuxt/test-utils 3 (vee-validate <Field>'s first,
  // undefined-scope slot render crashed mountSuspended); renders since 4.x.
  // The old snapshot was the starter template's Quasar markup.
  it('should match with snapshot', async () => {
    const component = await mountSuspended(CommonInputText)
    expect(component.html()).toMatchSnapshot()
  })
})
