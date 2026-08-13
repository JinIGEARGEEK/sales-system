import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CommonInputText from '~/components/Input/Text.vue'

describe('InputText Component Test', () => {
  it('should match with snapshot', async () => {
    const component = await mountSuspended(CommonInputText)
    expect(component.html()).toMatchSnapshot()
  })
})
