// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Agent worktrees under .claude/ are full checkouts of other branches
  { ignores: ['.claude/**'] },
)
