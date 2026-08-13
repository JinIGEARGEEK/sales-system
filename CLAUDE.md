# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

This is the **I GEAR GEEK Frontend Starter** — a Nuxt 4 SPA starter template built with **Nuxt UI 3**, **Tailwind CSS v4**, **Pinia**, **Vee-Validate**, and **i18n (EN/TH)**.

## Important: Always Read Spec Files

Before modifying any component or composable, **always read the corresponding `.spec` files** in the `tests/` directory first. Test files follow the pattern `tests/<ComponentPath>/<ComponentName>.nuxt.spec.ts`. Understanding existing tests ensures changes don't break expected behavior.

## Tech Stack

- **Framework**: Nuxt 4 (`ssr: false`, SPA mode)
- **UI Library**: Nuxt UI 3 (built on Reka UI + Tailwind CSS v4)
- **State Management**: Pinia (stores in `stores/`)
- **Form Validation**: Vee-Validate with `<Field v-slot>` pattern
- **HTTP Client**: Axios (via `composables/util/useAPI.ts`)
- **i18n**: `@nuxtjs/i18n` with Thai (default) and English locales
- **Icons**: Google Material Symbols via Iconify (`material-symbols:icon-name`)
- **Package Manager**: pnpm

## Project Structure

```
app/                        # Nuxt 4 app directory
├── components/
│   ├── Button/             # ButtonPrimary, ButtonOutline
│   ├── Input/              # Text, Password, Select, DatePicker, etc.
│   ├── Table/              # TableData, TablePagination, Card types
│   └── Container/          # ContainerTemplate
├── composables/
│   ├── service/            # API service composables
│   └── util/               # useAPI, useFormatter, useNotify, useAuth, useValidate
├── layouts/                # default (admin), ecommerce, landing, blank
├── pages/
│   ├── admin/              # Dashboard + User CRUD
│   ├── shop/               # Product listing, detail, cart
│   ├── landing/            # Marketing landing page
│   └── example/            # Component showcases (button, input, table, store)
├── stores/                 # Pinia stores (user, loading, cart)
├── constants/              # Mock data, table card types
├── interfaces/             # TypeScript interfaces
├── locales/                # i18n translations (en, th)
├── assets/styles/          # global.css (design tokens), typography.css
├── app.vue                 # Root component (UApp wrapper)
├── app.config.ts           # Nuxt UI theme config
└── nuxt.config.ts          # Nuxt configuration
tests/                      # Test files (*.nuxt.spec.ts)
```

## Key Conventions

### Components
- All form inputs wrap Nuxt UI components with Vee-Validate `<Field>` integration
- Props follow existing patterns: `v-model`, `label`, `placeholder`, `name`, `rules`
- Use `data-cy` attributes for test selectors
- Components are auto-imported by Nuxt from `components/`

### Icons
- Use **Material Symbols** format: `material-symbols:icon-name`
- Examples: `material-symbols:add`, `material-symbols:delete-outline`, `material-symbols:search`
- Reference: https://fonts.google.com/icons

### Styling
- Design tokens are CSS custom properties in `assets/styles/global.css`
- Use CSS variables: `var(--color-primary)`, `var(--color-gray)`, etc.
- Typography classes: `.title-01` through `.title-06`, `.body`, `.body-small`
- Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`)

### State Management
- Pinia stores in `stores/` are auto-imported
- Use `storeToRefs()` for reactive destructuring
- Pattern: `const userStore = useUserStore()`

### API Calls
- Use `useMutateApi<T, D>(path)` for create/update/delete
- Use `useFetchApi<T, D>(url, config)` for read operations
- Axios instance available via `useNuxtApp().$api`

### Notifications
- Use `useNotify()` composable: `.success()`, `.error()`, `.info()`, `.warning()`
- Built on Nuxt UI's `useToast()`

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Development server (http://localhost:3000)
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm test             # Run tests
pnpm lint             # Lint code
```

## Rules

- Always use `pnpm` as the package manager
- Do not add `tw-` prefix to Tailwind classes
- Do not use Quasar components — use Nuxt UI 3 equivalents
- Keep form validation using Vee-Validate `<Field>` pattern
- Use Material Symbols icons, not Lucide or other icon sets
- All new components should follow existing patterns in `components/`
- Read test files before modifying components they cover
