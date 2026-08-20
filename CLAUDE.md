# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

This is the **I GEAR GEEK Sales System** — a Nuxt 4 SPA (a CRM covering leads, contacts, companies, deals, quotes, contracts, payments, projects, and tasks) built with **Nuxt UI 3**, **Tailwind CSS v4**, **Pinia**, **Vee-Validate**, and **i18n (EN/TH)**. It originated from the I GEAR GEEK frontend starter template; the structure below reflects how the project actually evolved, not the starter's original layout.

## Important: Read These First

- **Business/UX specs** — before implementing a feature or changing behavior, check `biz_spec/`: `feature-spec.md`, `user-story.md`, `api-system-spec.md`, `design-system.md`, and `ux-ui-guidelines/` (layout, filter, modal, table conventions). These are the source of truth for business rules and UX patterns, and won't be evident from the code alone.
- **Spec files** — before modifying any component or composable, check for a corresponding test in `tests/`, pattern `tests/<ComponentPath>/<ComponentName>.nuxt.spec.ts`. Coverage is currently sparse (most of the codebase has no spec yet), so absence of a test isn't a signal — but if one exists, read it first.

## Tech Stack

- **Framework**: Nuxt 4 (`ssr: false`, SPA mode; no `app/` srcDir remap — top-level `components/`, `pages/`, `stores/`, etc. are the Nuxt convention here)
- **UI Library**: Nuxt UI 3 (built on Reka UI + Tailwind CSS v4)
- **State Management**: Pinia (stores in `stores/`)
- **Form Validation**: Vee-Validate with `<Field v-slot>` pattern
- **HTTP Client**: Axios (`plugins/axios.ts`, via `composables/utils/useAPI.ts`)
- **Error Tracking**: Sentry (`plugins/sentry.ts`, configured via `SENTRY_DSN`/`APP_ENV` runtime config)
- **Auth**: `middleware/auth.global.ts` route guard + `plugins/hydrate-auth.client.ts`
- **i18n**: `@nuxtjs/i18n` with Thai (default) and English locales
- **Icons**: Google Material Symbols via Iconify (`material-symbols:icon-name`)
- **Package Manager**: pnpm

## Project Structure

```
components/
├── Admin/                  # Admin/user-management components
├── Auth/                   # Login, change-password, auth-related components
├── Button/                 # ButtonPrimary, ButtonOutline
├── Container/              # ContainerTemplate
├── Crm/                    # Deal, lead, contact, company, quote, task components
├── Input/                  # Text, Password, Select, DatePicker, etc.
├── Table/                  # TableData, TablePagination, Card types
└── SwitchLang.vue
composables/
└── utils/                  # useAPI, useAuth, useNotify, useFormatter, useRole,
                             # useSubmitGuard, useDealMetrics, useCsvExport,
                             # usePdfExport, useServerListPage, and other
                             # domain/utility composables (flat, no subfolders)
stores/                     # Pinia stores — CRM domain: deals, quotes, contracts,
                             # payments, leads, contacts, companies, tasks, projects,
                             # activities, tags, auditLog, teamMembers, user, etc.
pages/
├── admin/                  # Users CRUD, pipeline-config, activity-log, trash
├── crm/                    # leads, deals, contacts, companies, tags, tasks,
                             # projects, reports
├── account/
├── login.vue
└── change-password.vue
layouts/                    # default, blank
middleware/                 # auth.global.ts
plugins/                    # axios, sentry, vee-validate, hydrate-auth.client
constants/                  # Mock data, table card types, ui constants
interfaces/                 # admin.d.ts, auth.d.ts, api.d.ts, crm.d.ts,
                             # reports.d.ts, tableData.d.ts, component.d.ts
locales/                    # i18n translations (en.ts, th.ts, admin/, crm/, global/, layout/)
biz_spec/                   # Business & UX source of truth — feature-spec, user-story,
                             # api-system-spec, design-system, ux-ui-guidelines/
assets/styles/               # global.css (design tokens), typography.css
app.vue                      # Root component (UApp wrapper)
app.config.ts                 # Nuxt UI theme config
nuxt.config.ts                 # Nuxt configuration
tests/                       # Test files (*.nuxt.spec.ts) — currently sparse coverage
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
- Read `biz_spec/` docs before implementing features or changing business behavior
- Read matching test files before modifying components/composables they cover
