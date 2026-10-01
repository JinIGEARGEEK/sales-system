# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

This is the **I GEAR GEEK Sales System** — a Nuxt 4 SPA (a CRM covering leads, contacts, companies, deals, quotes, contracts, payments, projects, and tasks) built with **Nuxt UI 3**, **Tailwind CSS v4**, **Pinia**, **Vee-Validate**, and **i18n (EN/TH)**. It originated from the I GEAR GEEK frontend starter template; the structure below reflects how the project actually evolved, not the starter's original layout.

## Important: Read These First

- **Business/UX specs** — before implementing a feature or changing behavior, check `biz_spec/`: `feature-spec.md`, `user-story.md`, `api-system-spec.md`, `design-system.md`, and `ux-ui-guidelines/` (layout, filter, modal, table conventions). These are the source of truth for business rules and UX patterns, and won't be evident from the code alone.
- **Spec files** — before modifying any component or composable, check for a corresponding test in `tests/`, pattern `tests/<ComponentPath>/<ComponentName>.nuxt.spec.ts`. Coverage is currently sparse (most of the codebase has no spec yet), so absence of a test isn't a signal — but if one exists, read it first. When a store/composable calls `useNuxtApp().$api` directly (most do) and also goes through `useApiErrorNotifier`/`useNotify` (which resolves `useToast()` off the real `useNuxtApp()` internally), don't `mockNuxtImport('useNuxtApp', ...)` to stub `$api` — that replaces the whole auto-import and breaks `useToast()` too. Instead `vi.spyOn(useNuxtApp().$api, 'get'/'post'/...)` on the real, already-provided instance (see `tests/utils/useContractGate.nuxt.spec.ts`); plain `mockNuxtImport` is fine only for a store/composable with no toast/notify usage (see `tests/stores/deals.nuxt.spec.ts`). Mounting a component that renders a `vee-validate`-`<Field>`-wrapped input (`InputText`/`InputTextarea`/`InputSelect`/etc.) via `mountSuspended` can crash on Field's first (undefined-scope) slot render — a known, accepted limitation; see the documented `it.skip` in `tests/Input/Text.nuxt.spec.ts` and `tests/Crm/QuoteItemsEditor.nuxt.spec.ts` before spending time "fixing" it yourself. End-to-end smoke tests live in `e2e/*.e2e.ts` (not `*.spec.ts`, so Vitest ignores them) and run against the production build with every `/api/v1/*` call answered by fixtures via `mockApi()` in `e2e/support.ts` — no backend or database needed; locate elements by their `data-cy` (Playwright's `getByTestId` is configured to use it). Set `PLAYWRIGHT_CHROMIUM_PATH` to use an already-installed Chromium instead of `pnpm exec playwright install chromium`. Reusable test-data builders (`makeDeal`, `makeContract`, `makeQuote`, the paginated-envelope `apiResponse` helper) live in `tests/factories.ts` — import from there instead of re-declaring a local copy once a shape is used by a second spec file; a builder used by only one spec stays local to it.

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
                             # usePdfExport, useServerListPage, useAwaitableEmit
                             # (+ useAwaitableSubmit), useDateOnly, useMoney,
                             # useDealReceivable, useDealWonHandoff, useLogActivity,
                             # and other domain/utility composables (flat, no subfolders)
stores/                     # Pinia stores — CRM domain: deals, quotes, contracts,
                             # payments, leads, contacts, companies, tasks, projects,
                             # activities, tags, auditLog, teamMembers, user, etc.
pages/
├── admin/                  # Users CRUD, pipeline-config, activity-log, trash, guideline
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
tests/                       # Test files (*.nuxt.spec.ts), mirroring source paths
                             # (tests/stores/, tests/utils/, tests/Crm/, tests/Input/),
                             # plus factories.ts (shared test-data builders) — currently
                             # sparse coverage
e2e/                         # Playwright smoke tests (*.e2e.ts), API mocked via
                             # e2e/support.ts; run after `pnpm build`
```

## Key Conventions

### Components
- All form inputs wrap Nuxt UI components with Vee-Validate `<Field>` integration
- Props follow existing patterns: `v-model`, `label`, `placeholder`, `name`, `rules`
- Use `data-cy` attributes for test selectors
- Components are auto-imported by Nuxt from `components/`
- Dialogs (`UModal`/`USlideover`) take their heading via the `title`/`description` props, never a custom `#header` slot (that leaves the dialog without an accessible name). Deletes, unsaved-changes guards, empty states, mobile filter collapse, status colours and dates follow `biz_spec/design-system.md` §5.7 — read it before adding any of those to a page
- A modal that saves waits for its parent: `const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))`, then `await submitAndClose(payload)` — Save spins until the parent's handler resolves, and the dialog stays open with the form intact if the handler returns `false`. Parent handlers toast their own error and `return false`; don't rethrow (`useSubmitGuard` would toast a second time). See `biz_spec/design-system.md` §5.7
- Auto-imports: exported functions *and* constants from `composables/**` are auto-imported, with two `unimport` blind spots that fail only at runtime (`ReferenceError`, not a lint/type error): a name used as a computed key inside a destructuring pattern (`const { [SOME_CONST]: x, ...rest } = obj`) is treated as a local for the whole file, and a name followed by `/` (division) isn't detected. Restructure the code (see `pages/crm/deals/[id].vue`'s `won_handoff` strip) or import explicitly with a comment

### Icons
- Use **Material Symbols** format: `material-symbols:icon-name`
- Examples: `material-symbols:add`, `material-symbols:delete-outline`, `material-symbols:search`
- Reference: https://fonts.google.com/icons
- Nuxt UI's own built-in icons are remapped to Material Symbols in `app.config.ts` (`ui.icons`) and served locally (`nuxt.config.ts` `icon.provider: 'server'`) — if a Nuxt UI upgrade adds an icon key, map it there too

### Styling
- Design tokens are CSS custom properties in `assets/styles/global.css`
- Use the tokens through Tailwind v4's var shorthand: `text-(--color-gray)`, `bg-(--color-primary)`, `ring-(--color-card-border)` — not the older `bg-[var(--color-x)]` bracket spelling (`global.css`'s forced-contrast safety net matches the shorthand; see `biz_spec/design-system.md` §2.4)
- Typography: pages use plain Tailwind utilities (`text-xl font-black` page titles, `text-sm`, `text-xs text-(--color-gray)`) per the heading scale in `biz_spec/design-system.md` §3. `assets/styles/typography.css` also defines `.title-1`…`.title-6` and `.static-*` (`.static-body`, `.static-body-sm`, `.static-body-xs`, …) token classes, but they're used only inside a few low-level components (e.g. `Table/Card/*`) — don't reach for them on a page
- Light mode only: `nuxt.config.ts` sets `ui.colorMode: false`, so no `dark:` variants or theme toggle
- Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`); custom utilities go in `assets/styles/global.css` via `@utility`, e.g. `scrollbar-hide` (hides a scrollable element's native scrollbar cross-browser while keeping it scrollable — use on chrome-like scroll containers like a nav panel or a horizontally-scrolling tab strip, not on scrollable data like tables/lists where the scrollbar itself signals more content)

### State Management
- Pinia stores in `stores/` are auto-imported
- Use `storeToRefs()` for reactive destructuring
- Pattern: `const userStore = useUserStore()`

### API Calls
- Use `useMutateApi<T, D>(path)` for create/update/delete
- Use `useFetchApi<T, D>(url, config)` for read operations
- Axios instance available via `useNuxtApp().$api`
- **A store's `update(id, changes)` is a full-record `PUT` for most entities, not a partial `PATCH`** — the backend overwrites every mapped field, so a field `changes` omits gets zeroed out server-side (the 2026-09-15 Kanban-drag bug; full writeup in `biz_spec/design-system.md` §8). Every such store types `changes` as an `XUpdatePayload` in `interfaces/crm.d.ts` whose required fields are exactly the ones the handler overwrites (optional = kept when omitted), so a missing field is a compile error: Lead, Prospect, Deal, Company, Contact, Tag, AppSettings, PipelineStage, ProspectStage, LeadScoringCriterion, and `OptionUpdatePayload` for the seven name + `is_active` option lists. To edit one field of a loaded record, build the payload from it with `fullDealUpdatePayload()` / `fullCompanyUpdatePayload()`. Never widen a payload type back to `Partial<...>` to silence an error. Real partial merges keep `Partial` and say so in a comment: `stores/contracts.ts`, `stores/payments.ts`, `stores/projects.ts`. Single-field changes use a narrow endpoint where one exists: `stores/deals.ts`'s `updateStage()`, `stores/leads.ts`/`stores/prospects.ts`'s `updateStatus()` (the Kanban drag-moves)

### Dates and money
- Local dates for inputs: `toDateInputValue()` (`useFormatter`) builds `YYYY-MM-DD` from local parts — never `toISOString().slice(0, 10)`, which is the UTC day (yesterday before 07:00 in Thailand)
- Date-only API fields (`Contract.end_date`, `CustomerProduct.renewal_date`) stay `'YYYY-MM-DD'` strings end to end (`useDateOnly.ts`: `toDateOnly`, `daysUntilDateOnly`, `countdownBadge`); never pass them through `new Date()` + a local-time formatter. `addDays`/`dateOnlyToLocalNoon` live there too
- Money: `currency()` from `useFormatter` ("฿1,234.00"), `roundSatang()`/`VAT_PERCENT` from `useMoney.ts`. Revenue (Deal value, forecast) is pre-VAT; what a customer owes is `dealReceivable()` — the latest Accepted Quote's taxable amount + VAT when it has priced items, else the Deal value — minus cash + WHT. Keep it identical to `sales-system-api`'s Outstanding Balance rule. Quote totals come only from `useQuoteTotals`/`quoteTotalsOf` (mirrors the API's `ComputeQuoteTotals` step for step, satang-rounded): an `incl_tax` quote with VAT on backs VAT out of its prices, never adds it again. An Accepted or Rejected quote is read-only apart from its status (API 409)
- Moving a Deal into Won from anywhere runs `useDealWonHandoff` (follow-up task + Create Project)

### Notifications
- Use `useNotify()` composable: `.success()`, `.error()`, `.info()`, `.warning()`
- Built on Nuxt UI's `useToast()`
- Wording: English is the record + past tense with no "successfully" and no trailing period ("Task added", "Deal deleted"); Thai ends in "สำเร็จ". Show a success toast only after the API call resolves
- The company doesn't use SMTP: anything alert-like must reach people in-app (the API's notification rules create Tasks and show in Recent Alerts). Treat email as an optional extra, never the only channel

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Development server (http://localhost:3000)
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm test             # Run unit tests (Vitest)
pnpm test:e2e         # E2E smoke tests (Playwright) — run `pnpm build` first
pnpm lint             # Lint code
pnpm typecheck        # Type-check (nuxi typecheck / vue-tsc) — also runs in CI
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
