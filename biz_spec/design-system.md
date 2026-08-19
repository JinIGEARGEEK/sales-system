# Design System — CRM for Sales Team

**Companion document to:** `feature-spec.md`, `user-story.md`
**Scope:** Visual design tokens, layout conventions, component patterns, and UI rules actually implemented in this codebase, as of 2026-08-17.
**Purpose:** A single reference for future development so new pages/components stay visually and structurally consistent with what's already built, instead of re-deriving conventions from scratch or drifting page-by-page.

This document describes what the code **actually does today** (verified against `assets/styles/global.css`, `assets/styles/typography.css`, `app.config.ts`, `layouts/`, and `components/`), not aspirational rules. Where something is inconsistent or fragile, it's called out explicitly in §10 rather than glossed over.

---

## 1. Tech Stack

- **Framework**: Nuxt 4, SPA mode (`ssr: false`)
- **UI Library**: Nuxt UI 3 (Reka UI + Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 (CSS-based `@theme`/`:root` tokens, no `tailwind.config.js`)
- **State**: Pinia (`stores/user.ts`, `stores/loading.ts`, `stores/companies.ts`, `stores/contacts.ts` — see §8 for the entity-store pattern)
- **Forms**: Vee-Validate, via the `<Field v-slot>` pattern wrapped in `components/Input/*`
- **i18n**: `@nuxtjs/i18n`, Thai (`th`, default) and English (`en`)
- **Icons**: Material Symbols via Iconify (`material-symbols:icon-name`)
- **Font**: "Prompt" — see §3 for a real caveat about which weights actually exist

---

## 2. Color System

All colors are CSS custom properties defined in `assets/styles/global.css`, split between an `@theme` block (Tailwind-facing tokens) and `:root` (the full palette + Nuxt UI's runtime shade scales). **Always reference a `var(--color-*)` token or a Tailwind utility that resolves to one — never hardcode a new hex value for something a token already covers.**

### 2.1 Brand tokens

| Token | Current value | Notes |
|---|---|---|
| `--color-primary` | `color-mix(in oklab, #1B2233 93%, #A9B9EE 7%)` — a dark navy, **intentionally matching `--color-sidebar-bg`** | Changed from a light periwinkle blue (`#A9B9EE`) so the brand accent color reads consistent with the sidebar. Full `-50`…`-950` shade scale (lines 53–63) is derived from this same expression — **when changing the base, update the whole scale, not just the bare token** (Nuxt UI's `bg-primary-500` etc. read the scale directly, not `--color-primary`). |
| `--color-secondary` | `#E8EBEF` — a light cool gray | Darkened from a near-white `#FEFFFF`. Not yet used anywhere in `pages/`/`components/` — it's a ready token, not a rendered color today. |
| `--color-accent-green` | `#1F9D6B` | Used for "other" non-semantic hover/gradient tones and blended into secondary's darker shades (600–950). |
| `--color-sidebar-bg` | `color-mix(in oklab, var(--color-black) 93%, var(--color-primary) 7%)` | Since primary is now itself a black/primary mix, this nests — the result is still effectively pure `--color-black`, imperceptibly different from before. |

### 2.2 Neutrals (blue-tinted, not true gray)

| Token | Value |
|---|---|
| `--color-white` | `#FFFFFF` |
| `--color-light-gray-1` | `#F4F7FD` |
| `--color-light-gray-2` | `#D7DEF0` |
| `--color-gray` | `#7C89A8` |
| `--color-dark-gray` | `#4B5875` |
| `--color-black` | `#1B2233` |

`--ui-text` and `--ui-text-highlighted` are both forced to `var(--color-black)` (global.css:131–132) because this is a **light-mode-only app** — Nuxt UI's default gray body text was overridden so unstyled text renders true black everywhere.

### 2.3 Semantic / status colors

| Purpose | Toast/accent | Background tint |
|---|---|---|
| Success | `--color-success-toast: #07B53B` | `--color-success-toast-bg` / `--color-success-bg`: `#E6F8EB` |
| Info | `--color-info-toast: #2D72A7` | `--color-info-toast-bg` / `--color-info-bg`: `#EAF1F6` |
| Warning | `--color-warning-toast: #F8C40E` | `--color-warning-toast-bg` / `--color-warning-bg`: `#FEF9E7` |
| Danger | `--color-danger-toast: #F17575` | `--color-danger-toast-bg` / `--color-error-bg`: `#FAEEEF` |

These map to Nuxt UI's `color="success"|"info"|"warning"|"error"` props (used on `UBadge`, `UAlert`, etc.) — use the prop, not the raw var, whenever a Nuxt UI component supports a `color` prop.

### 2.4 Forced-contrast safety nets (global.css:212–249)

Two global CSS rules exist specifically because this app's brand primary/secondary tokens are far from Tailwind's semantic gray defaults:

1. **`[class*="bg-secondary"], .text-secondary`** → forced `color: var(--color-black)`. Secondary is near-white, so Nuxt UI's default light-on-light text pairing is illegible; every secondary surface gets dark text unconditionally (safe — this app has no dark mode).
2. **`[class*="bg-primary"]:not(.../10):not(.../15)`, `bg-[var(--color-primary)]`, `bg-[var(--color-black)]`, `bg-[var(--color-dark-gray)]`, `bg-[var(--color-accent-green)]`** → forced `color: var(--color-white)`. Any hand-written dark/solid background gets white text automatically. The `bg-primary/10` and `bg-primary/15` exclusions exist so *soft-tint* badges/active-nav-states (which use dark text on a light tint) aren't overridden. There's also an explicit exclusion for Reka UI calendar day cells, whose conditional `data-[selected]:bg-primary` utilities would otherwise get matched by this string-based selector even when inactive.

**Rule for future work:** if you hand-write a new dark solid background class (not going through a Nuxt UI `color` prop), it either already matches one of these selectors (safe) or you must set text color explicitly — don't assume default text will be readable.

### 2.5 Content-area background — `--color-content-bg`

`layouts/default.vue`'s `<main>` uses `var(--color-content-bg)` (currently `#F0F3FC`), its own dedicated token — **deliberately not** `--color-light-gray-1`, since that token is shared with hover states and progress-bar tracks elsewhere (`components/Crm/MetricBar.vue`, `StatusPill.vue`, `pages/index.vue`) and changing it would affect those too. This value has been iteratively lightened several times on request; **edit `--color-content-bg` in `global.css` directly** rather than hardcoding a new hex back into the template.

The outer app shell (the flex row wrapping sidebar+main) has its own gradient, tokenized as `--color-app-shell-gradient-{from,via,to}` — but since `<main>` is fully opaque and covers all remaining space, **this outer gradient is only visible through the semi-transparent sidebar's blur, not directly.** Don't expect edits to it to be visually obvious; the actually-visible page background is `<main>`'s own color.

### 2.5.1 Card border color — `--color-card-border`

Every content card (`UCard` instances in `pages/index.vue`, `CrmStatCard`) and hand-built card-like containers (`CrmPipelineBoard`'s Kanban columns and cards) use `var(--color-card-border)` — `color-mix(in srgb, var(--color-gray) 35%, transparent)` — for a border/ring that stays visible against the light content background, instead of Nuxt UI's default (too-subtle) ring or the even-lighter `--color-light-gray-2`. If content backgrounds get lightened further (§2.5), check whether this token still reads clearly and darken it if not — don't reintroduce inline `ring-[var(--color-gray)]/35` repeats across files.

### 2.6 Data-visualization colors — deliberately NOT tied to `--color-primary`

`components/Crm/MetricBar.vue`'s default bar fill and the revenue-trend chart bars in `pages/index.vue` both use a plain `bg-sky-400` (light blue), **not** `var(--color-primary)`. This was deliberate: primary is now a dark navy (§2.1), which reads poorly as a progress-bar fill against a light track. Keep progress/amount bars on `sky-400` (or an explicit override, like the green win-rate bars) regardless of future primary-color changes — don't reconnect them to `--color-primary`. (This got silently reverted to `--color-primary` by an earlier refactor pass and was restored — if you touch either file, keep this rule in mind.)

The new "Forecast Trend" chart card (`pages/index.vue`, next to Revenue Trend) follows the same icon-on-token/bar-on-stock-Tailwind-color split Revenue Trend established: its header icon chip uses the `--color-chart-violet` token (`bg-[var(--color-chart-violet)]/15`), while its bars use a plain stock `bg-violet-400` — not `--color-chart-violet` directly, mirroring how Revenue Trend pairs an info-token icon chip with plain `bg-sky-400` bars. A second chart now follows this existing convention; no new rule was invented.

Two chart-only categorical tokens exist purely for multi-series charts (Pipeline by Stage, Win Rate by Industry, dashboard stat-card icon chips): `--color-chart-violet` (`#6B5CA5`) and `--color-chart-lost` (`#C65D3B`, a hue-shifted rust-red — deliberately not `--color-danger-toast`, since plain green-vs-coral fails CVD separation when a Won bar sits next to a Lost bar). Together with the existing accent/info/warning/success tokens they form a fixed 4-color categorical cycle (`CHART_CATEGORICAL_CLASSES` in `pages/index.vue`, validated via the dataviz skill's `validate_palette.js`): green → info-blue → warning-amber → chart-violet, falling back to neutral gray past the 4th series rather than reusing a hue. Won/Lost stage bars always use the semantic success/chart-lost colors regardless of cycle position; only the "open" stages/industries cycle through it. This assignment order lives in `pages/index.vue`, not `global.css`, since it's chart-assignment logic, not a token value.

---

## 3. Typography

### 3.1 Font

"Prompt" is loaded via local `@font-face` in `assets/styles/typography.css`. All weights actually used in this codebase now have a real font file, shipped as `.woff2` (not `.ttf`) for a ~70% smaller payload — `Prompt-Light.woff2` (300), `Prompt-Regular.woff2` (400), `Prompt-Medium.woff2` (500), `Prompt-SemiBold.woff2` (600), `Prompt-Bold.woff2` (700), `Prompt-Black.woff2` (900), all sourced from Google's own `google/fonts` repo (same OFL license as the original three) — so `font-semibold`/`font-bold`/`font-black` all render as genuine weights, not the browser's synthetic ("faux") bold. If a new weight is ever added as a `.ttf` from Google Fonts, convert it to `.woff2` before committing (e.g. `fonttools varLib` / any woff2 compressor) rather than shipping the raw TTF.

**Historical note:** before these three files were added, every `font-black` page title carried a `[-webkit-text-stroke:0.6px_currentColor]` hack to compensate for missing real weight — that hack has been removed everywhere (see §3.2) now that 900 is a real face; don't reintroduce it.

### 3.2 Page title convention

Every page's main `<h2>` title uses the same exact class string:

```
text-xl font-black
```

This is applied identically across all 28 pages (list, create, and detail views) — **when adding a new page, copy this exact string**, don't approximate it, so titles stay pixel-consistent site-wide.

### 3.3 Design-token typography scale (`typography.css`)

A responsive title scale and static body/link/button scale exist as CSS custom properties + utility classes, independent of Tailwind's own `text-*` scale:

| Class | Mobile size/lh | Desktop size/lh (≥768px) | Weight |
|---|---|---|---|
| `.title-1` | 26px/40px | 34px/50px | 500 |
| `.title-2` | 24px/36px | 26px/40px | 500 |
| `.title-3` | 20px/30px | 22px/32px | 500 |
| `.title-4` | 18px/28px | 20px/30px | 500 |
| `.title-5` | 16px/24px | 18px/28px | 500 |
| `.title-6` | 14px/20px | 16px/24px | 500 |

Static (non-responsive) utilities: `.static-body`, `.static-body-sm`, `.static-body-xs`, `.static-body-2xs`, `.static-link` (underlined), `.static-link-sm` (underlined), `.static-button`, `.static-button-sm`.

**In practice, actual pages don't use these `.title-*`/`.static-*` classes** — they use plain Tailwind (`text-xl font-black`, `text-sm`, `text-xs text-[var(--color-gray)]`, etc.) directly. The typography-scale classes exist and work, but aren't the established convention for page content. Don't mix the two systems on the same page; follow what neighboring pages already do (plain Tailwind, per §7).

---

## 4. Spacing Scale (page-level)

As of the most recent density pass, every page under `pages/` follows this consistent step-down from a slightly looser starting scale:

| Purpose | Value |
|---|---|
| Page root padding | `p-5` |
| Margin after title block / before content | `mb-4` |
| Margin before a following section | `mt-4` |
| Grid/flex gap between cards, stat tiles, or major sections | `gap-4` |
| Grid gap between stacked form fields | `gap-3` |
| Vertical stack spacing between grouped items (e.g. list of upsell candidates) | `gap-2`–`gap-3` |

**Do not use `p-6`, `mb-6`, `mt-6`, `gap-5`, `gap-6`, `space-y-4`, or `space-y-6` for new page-level layout** — those were the previous, looser scale and have been swept out of every existing page. Component-*internal* spacing (icon-to-label gaps inside a button/nav-row, padding inside a badge, avatar+text row gaps) is unaffected by this scale and typically sits at `gap-1`–`gap-3` — copy the pattern from the nearest existing component rather than the page-level table above.

Nuxt UI's default `UCard` padding (`header`/`footer`: `p-4 sm:px-6`, `body`: `p-4 sm:p-6`) is overridden globally to a uniform `p-3 sm:p-4` on all three slots via `app.config.ts`'s `ui.card.slots`, so every filter-panel `UCard` across list pages gets the tighter scale automatically and a card's header/footer padding always matches its body — don't add a per-instance `:ui="{ header/body/footer: '...' }"` override to "fix" this, and don't reintroduce `p-6` by overriding it back up. `TableData`'s own outer wrapper (`components/Table/Data.vue`) uses `p-3` for the same reason.

---

## 5. Layout & App Shell

### 5.1 `layouts/default.vue` — the authenticated app shell

- **Sidebar** (`<aside>`, desktop only, `md:w-44`): dark glass panel — `bg-[var(--color-sidebar-bg)]/90` + `backdrop-blur-2xl`, with a subtle top-left sheen overlay (`bg-linear-to-br from-white/10 via-transparent to-transparent`). Contains, top to bottom: brand row (hub icon in `text-yellow-400` + "CRM System", `h-14`), nav list, then a footer block (avatar/name/email, then a `SwitchLang` + logout row below a divider).
- **Nav items**: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10`, active state adds `bg-white/10 font-medium`. Icon gets `size-5 shrink-0`, label gets `truncate` — this is deliberate so long labels never wrap to two lines (a real bug that was fixed; keep both classes on any new nav item).
- **No topbar** — it was removed entirely. There is no persistent header row above page content on desktop.
- **Mobile**: a `USlideover` drawer (triggered by a `fixed top-3 left-3 z-20 md:hidden` menu button) mirrors the sidebar's nav list, brand header, and footer (lang switch + logout) via named slots (`#header`, `#body`, `#footer`).
- **Main content**: `<main class="flex-1 overflow-y-auto bg-[var(--color-content-bg)]">` — see §2.5.

### 5.2 `layouts/blank.vue`

Used only by `pages/login.vue` (`definePageMeta({ layout: 'blank' })`). No sidebar/topbar — a bare shell for full-bleed custom pages.

### 5.3 The login page's glassmorphism treatment is intentionally isolated

`pages/login.vue` has a much more elaborate glass/3D-glass visual treatment (custom SVG "GG" glass logo via `<mask>`+gradients, animated-looking circuit-trace SVG lines, a `backdrop-blur-sm backdrop-saturate-50 backdrop-brightness-110` card) than the rest of the app. **This is deliberate and scoped to the login screen only** — the main authenticated app (sidebar/topbar/content) uses a much lighter touch (sidebar glass is `backdrop-blur-2xl` over a plain dark fill, no SVG logo decorations, no circuit traces). Don't port the login page's full glass treatment into internal app pages; it was tuned specifically for a marketing-style entry screen, not a daily-use dashboard.

### 5.4 Standard list-page composition

Every `pages/crm/*/index.vue` and `pages/admin/*/index.vue` follows this exact structure (see `pages/crm/leads/index.vue` as the canonical example):

```
<div class="p-5">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ pageTitle }}</h2>
    <ButtonPrimary :label="..." icon="material-symbols:add" @click="navigateTo('.../create')" />
  </div>

  <UCard class="mb-4">
    <!-- filters: CrmStatusPill for status tabs, InputText for search, InputSelect for dropdown filters -->
  </UCard>

  <TableData :columns :rows :total :total-page @change-page @change-per-page @view-detail @edit @delete ... />

  <CrmConfirmDeleteModal v-model:open :name @confirm="confirmDelete" />
</div>
```

### 5.5 Standard create/form-page composition

See `pages/crm/leads/create.vue`:

```
<div class="p-5">
  <div class="mb-4">
    <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ heading }}</h2>
    <p class="text-sm text-[var(--color-gray)]">{{ subheading }}</p>
  </div>

  <UAlert v-if="duplicateWarning" class="mb-4" color="warning" variant="subtle" ... />

  <ContainerTemplate>
    <Form @submit="onSubmit">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InputText ... /> <!-- one per field; use md:col-span-2 wrapper for full-width fields like notes -->
      </div>
      <div class="mt-4 flex gap-3">
        <ButtonPrimary label="..." type="submit" />
        <ButtonPrimary label="Cancel" outline @click="navigateTo('...')" />
      </div>
    </Form>
  </ContainerTemplate>
</div>
```

### 5.6 Standard detail/edit-page composition

Same title+`ContainerTemplate`+`Form` shell as §5.5, but title is dynamic (e.g. `{{ lead.name }}`) and usually sits inside a header row with a back button and status badge (see `pages/crm/leads/[id].vue`, `pages/crm/deals/[id].vue`, `pages/crm/companies/[id].vue`). Detail pages for entities with sub-sections (deals, companies) use `UTabs` inside the card for Overview/Activity/etc.

---

## 6. Iconography

Material Symbols exclusively, referenced as `material-symbols:icon-name` (outline style preferred, e.g. `material-symbols:hub-outline`, `material-symbols:person-search-outline`). Never mix in Lucide or another icon set. Look up names at fonts.google.com/icons before inventing one.

---

## 7. Component Library (`components/`)

| Component | Purpose | Notes |
|---|---|---|
| `ButtonPrimary` (`components/Button/Primary.vue`) | The only button wrapper in the app | Wraps `UButton`. Props: `outline` (→ `variant="outline"`), `flat` (→ `variant="ghost"`), `block`, `fitContent`, `small`, `color` (default `primary`). Always `rounded-full px-6 min-w-24`. **There is no separate `ButtonOutline` component** (despite older docs implying one) — use `<ButtonPrimary outline>`. |
| `InputText`, `InputPassword`, `InputSelect`, `InputTextarea`, `InputDatePicker`, `InputDateRangePicker` (`components/Input/`) | Form field wrappers, all built on `InputFormField` + a Nuxt UI primitive, integrated with Vee-Validate | Follow the existing `v-model`/`label`/`placeholder`/`name`/`rules` prop pattern for any new input wrapper — spread `useInputBaseProps()` (`composables/utils/useInputBaseProps.ts`) into `defineProps({ ... })` to get `name`/`rules`/`label`/`dataCy`/`placeholder` for free instead of redeclaring them; pass `{ placeholder: '...' }` to override the default placeholder (e.g. `InputDatePicker` uses `'DD/MM/YYYY'`). `modelValue` is deliberately excluded from that shared object since its type/default differs per wrapper (string, string\|number, or an object for `InputDateRangePicker`) — keep declaring it per component. `InputTextarea`'s `<UTextarea>` explicitly sets `class="w-full"` — any new wrapper around a Nuxt UI form primitive should do the same, since Nuxt UI's root is `inline-flex` and won't stretch to its container without it. **Two size mechanisms coexist on `InputText`/`InputSelect` — don't combine them.** The older `small` boolean only shrinks font size (`text-sm`), used in ~25 places across the app; a proper `size` prop (default `'md'`, forwarded straight to the underlying `UInput`/`USelect`, real Nuxt UI height/padding variant) was added later specifically so a row of inputs/buttons can match height (e.g. `size="xs"` next to `UButton size="xs"` — this is what fixed the dashboard filter bar's inconsistent heights). Prefer `size` for any new call site needing real height control; `small` stays only for existing font-only usages. `InputDateRangePicker` only has `size` (no legacy `small`). `InputTextarea` deliberately overrides its `<UTextarea>` to `text-base` (16px) instead of Nuxt UI's default `md`-size `text-sm` (14px) — this app's 14px scale is tuned for scanned content (tables, labels, badges), but a textarea is genuinely *read* prose (notes, addresses, descriptions), where current accessibility guidance calls for 16px minimum. Don't remove this override to "match" the rest of the app's density scale — the two cases aren't the same. `InputPassword`'s visibility-toggle `UButton` carries a localized `aria-label` (`global.input.showPassword`/`hidePassword`) since it's icon-only — any other icon-only button should follow the same pattern. **`InputFormField` generates a stable `fieldId`/`errorId` pair** (from `name`, falling back to `dataCy`/`useId()`) and exposes them as extra slot props (`v-slot="{ field, errors, fieldId, errorId }"`) alongside its label, which is now a real `<label :for="fieldId">` instead of a plain `<span>`. Every wrapper's underlying Nuxt UI primitive binds `:id="fieldId"` plus `:aria-invalid="errors.length > 0"` and `:aria-describedby="errors.length ? errorId : undefined"` — a new wrapper around a Nuxt UI form primitive should do the same instead of leaving its label/error text unassociated from the actual input. |
| `ContainerTemplate` (`components/Container/Template.vue`) | The white card wrapper around every form (`bg-white rounded-xl p-5 drop-shadow`) | Use for every create/edit form; don't reach for a bare `UCard` for forms. |
| `TableData` / `TablePagination` / `Table/Card/*` (`components/Table/`) | The data-table system, paired with `TABLE_CARD_TYPE` (`constants/tableCardType.ts`) for column render types (STATUS, ACTION, LINK, MULTI_LINE, UPDATED_AT) | Every list page uses this instead of a hand-rolled table. |
| `CrmStatusPill` | Segmented status-filter tabs (not a status *badge* despite the name — see `toBadge()` in `useFormatter` for actual badge coloring) | Active state: `border-[var(--color-primary)] bg-[var(--color-primary-bg)] text-[var(--color-primary)]`. Inactive: light gray border/bg. |
| `CrmMetricBar` | Horizontal progress/amount bar (label + track + fill + slot for trailing stats) | Default fill `bg-sky-400` — see §2.6, don't reconnect to primary. Optional `tooltip` prop (falls back to `"label — percent%"`) wraps the track in a `UTooltip`. |
| `CrmStatCard` | Dashboard/report stat tile (`UCard` + label/value/hint) | `valueClass`/`hintClass` props for conditional coloring (e.g. green when healthy, red when not). Optional `icon`/`iconClass`/`iconBgClass` render a colored icon chip; optional `accentGlassClass` renders a frosted-glass gradient strip down the card's left ~10% (the root `UCard` has `overflow-hidden` specifically so this strip is clipped to the rounded corners). When a page shows several same-shaped stat cards side by side (lead-source conversion, pipeline stages, industries), assign the icon/bar colors from `constants/ui.ts`'s `CHART_CATEGORICAL_COLORS`/`CHART_FALLBACK_COLOR` by index — don't hand-roll a second copy of that palette, and don't cycle past its 4 entries (5th+ item gets the fallback gray). |

### 7.1 Currency display — one rule, two contexts

Every currency figure app-wide is prefixed with the `global.currencySymbol` locale key (`฿`) — never a trailing "THB"/"บาท" unit span (that convention was removed). Which *number format* follows the symbol depends on the context, not the page:
- **At-a-glance contexts** (dashboard stat tiles, list/table columns, Kanban cards, sidebar summaries) use `useFormatter`'s `priceFormatCompact` (`0,0.[0]a` → `฿5.2M`, `฿77.8K`) — these are scanned, not read to the cent.
- **Financial/ledger contexts** (the Payments tab's totals and per-installment amounts, a Quote's per-line-item price) keep full-precision `priceFormat` (`฿1,234.00`) — these are reconciled against real transactions or shown on a customer-facing document, where exact cents matter. Don't compact-format these just to match the rest of the app; don't full-precision-format a stat tile either — match the *use*, not the page.
| `CrmActivityTimeline`, `CrmPipelineBoard`, `CrmTeamMemberSelect`, `CrmConfirmDeleteModal` | Domain-specific composed components | `PipelineBoard` resolves a stage's color by first checking the hand-authored `DEAL_STAGE_COLORS` fallback map (`constants/mockData/deals.ts`, covering only the original default stages), then the Admin-configurable `stores/pipelineStages.ts` (`pages/admin/pipeline-config.vue`), then `FALLBACK_COLOR` — see §10 for the remaining fragility. It also takes an optional `columnCounts` prop (`Record<string, number>`) so a column's header count can reflect a server-side total instead of just `grouped[column].length`, and an optional `column-footer` slot (scoped with `{ column }`) for a per-column "Load more" affordance — both added for `pages/crm/deals/index.vue`'s per-stage-paginated Kanban board (resolves the Kanban-board exception previously noted under `api-system-spec.md`'s NFR-003). |
| `SwitchLang` | Segmented TH/EN pill toggle | Uses `color-mix(in srgb, currentColor N%, transparent)` for its background/active tint instead of hardcoded colors, so it adapts to whatever text color context it's placed in (dark sidebar, or a light page) — **keep this currentColor-based approach if you touch this component**; don't hardcode white/black into it. |
| `CrmImportContactsModal` | FlowAccount "สมุดรายชื่อ" (address book) bulk-import modal for Companies/Contacts | Parses CSV/XLS/XLSX via the `xlsx` (SheetJS) package. Matches columns by exact Thai header text (not position) against a hardcoded `HEADER_MAP`, so it only works for that specific FlowAccount export shape — see §8 and §10. Rendered via `<LazyCrmImportContactsModal>` on the Companies/Contacts list pages (Nuxt's auto-generated `Lazy` component) so the `xlsx` package — the single largest third-party chunk in the app — only loads when a user actually opens Import, not on every list-page visit. Any future modal that pulls in a similarly heavy one-off dependency should follow the same `Lazy` pattern. |

---

## 8. State Management: Entity Stores

CRM entities that need to be created/edited/deleted from more than one page go through a Pinia store under `stores/`, not a local `ref([...])` copied at page setup. This exists specifically because of a real bug class from the pre-API era: before `stores/companies.ts` and `stores/contacts.ts` existed, every page (`crm/companies/*`, `crm/contacts/*`, `crm/deals/*`, `pages/index.vue`) independently seeded its own local copy of mock data — so a company created on one page was invisible everywhere else (e.g. a new company wouldn't appear in the Deal-creation company picker), and a plain function reading a static array couldn't resolve names for anything created after page load. This app is now backed by a real Go/Postgres API (see the README/`api-system-spec.md`) — the entity-store pattern below is what keeps the same cross-page-visibility guarantee now that data comes from the network instead of a static array.

**The pattern** (see `stores/companies.ts` / `stores/contacts.ts`):
- `state.items` (plus `total`/`page`) populated by `fetchAll()`, a `GET` request via `$api` (Axios, `composables/utils/useAPI.ts`) — called once per session via the usual `if (store.items.length === 0) store.fetchAll()` guard, not re-seeded from any local constant.
- Many stores also expose a `fetchList(params)` for server-side-paginated list pages — it deliberately does **not** touch `items`/`total`/`page`, since those stay the "up to 200, everything" cache that dropdowns/detail pages/getters rely on via `fetchAll()`.
- `getters` for read-heavy lookups used across pages (`nameById`, `findByName` on the companies store) — prefer these over re-filtering `items` inline in every consuming page.
- `add(entity)`/`update(id, changes)`/`remove(id)` each call the real API (`POST`/`PUT`/`DELETE` via `$api`) and then patch `items` locally from the response (push/splice/filter) rather than re-fetching the whole list — so the UI updates immediately without waiting on a second round-trip. Delete is typically a *soft* delete server-side (`deleted_at` set, row excluded from future `GET`s) with a separate `trashItems`/`restore` pair (`createTrashActions` in `stores/helpers.ts`) rather than a hard delete.
- Pages read via `computed(() => store.items)`, never copy into a local `ref` — list pages' own `search`/`filter` computeds still filter that store-backed array client-side, same as before.
- Edit/detail pages get the live record via `computed(() => store.items.find(...))`; after an `update()` call the store already patches its own `items` entry, so the page doesn't need to reassign anything itself.

**Resolved:** Leads, Deals, and Tags have since been migrated to this same pattern (`stores/leads.ts`, `stores/deals.ts`, `stores/tags.ts` — all real API-backed stores now, not page-local `ref([...MOCK_X])` copies) — this section's original cross-page-invisibility bug no longer applies to any of the three. One nuance worth knowing if you touch the Deals Kanban board specifically: `pages/crm/deals/index.vue` deliberately does **not** read `dealsStore.items` for its own rendering — it fetches each active pipeline stage's Deals into a page-local, per-stage-paginated `dealStageBuckets` map instead (via `dealsStore.fetchList()`, which never touches `items`/`total`), so the board can page a stage past `dealsStore.fetchAll()`'s `per_page: 200` cap. Every other Deal consumer (detail page, dropdowns, duplicate-deal checks, Global Search, dashboard) still reads the shared `dealsStore.items` via the usual `if (dealsStore.items.length === 0) dealsStore.fetchAll()` guard, so this is a rendering-only exception for one page, not a fork of the store pattern itself.

---

## 9. i18n Conventions

- Locale files live under `locales/<domain>/{en,th}.ts` (e.g. `locales/crm/leads/en.ts`), aggregated into `locales/en.ts`/`locales/th.ts`.
- **คำทับศัพท์ (transliterated-loanword) policy**: for core CRM domain nouns, the Thai locale keeps the **English word itself** rather than a Thai phonetic transliteration — e.g. `Dashboard`, `Lead`, `Deal`, `Tag`, `Project`, `Module`, `Link` all appear as literal English words embedded in otherwise-Thai sentences (`"เพิ่ม Deal"`, `"Dashboard ยอดขาย"`), instead of `แดชบอร์ด`/`ลีด`/`ดีล`/`แท็ก`. This was a deliberate, systematic pass — **don't reintroduce Thai transliterations for these terms**; if a new domain noun needs a Thai label, check whether the English-in-Thai-sentence pattern fits before transliterating.
- The Admin section's user-management area is labeled "Staff"/"พนักงาน" (not "Users"/"ผู้ใช้งาน" or "Customers"/"ลูกค้า") — this refers to internal system/staff accounts, distinct from sales customers/leads/deals. Keep this terminology if extending admin user management.

---

## 10. Known Inconsistencies & Fragile Spots (be aware, don't silently "fix" without checking impact)

- **`PipelineBoard.vue`'s `DEAL_STAGE_COLORS` map (`constants/mockData/deals.ts`) only covers the original default stages** — pipeline stages are now Admin-configurable (`/admin/pipeline-stages`, `stores/pipelineStages.ts`), but a newly added/renamed custom stage has no matching row in that hardcoded color map, so it silently falls back to `FALLBACK_COLOR` (`var(--color-primary)`, i.e. dark navy) instead of erroring or picking a distinct color. There's still no single shared source of truth for stage color — if you add a stage via the Admin screen and want it visually distinct on the Kanban board, a color has to be added to `DEAL_STAGE_COLORS` by hand (or `PipelineStage` needs its own color field, which doesn't exist yet).
- **`--color-secondary` is unused in any actual page/component** — it exists as a token and Nuxt UI shade scale but nothing renders with `color="secondary"` yet. Don't assume changing it has any visible effect until something adopts it.
- **The typography-scale classes (`.title-1`…`.title-6`, `.static-*`) are not the pages' actual convention** — real pages use plain Tailwind utilities (§3.3, §4). Don't assume a new page should reach for `.title-2`; match its sibling pages instead.
- **Login page (`pages/login.vue`) has drifted to a noticeably more elaborate visual treatment** (circuit-trace SVG lines, heavier glass tuning) than documented in earlier design iterations — always re-read the file directly before editing it rather than assuming its state from memory or prior conversation notes.
- **No `ButtonOutline` component exists** despite some older internal references implying one — it's `<ButtonPrimary outline>`.
- **`ecommerce`/`landing`/`example` page directories mentioned in some earlier project documentation don't exist in `pages/`** — this app has narrowed to CRM + Admin only. Don't assume those routes/layouts are available.

---

## 11. Rules for Future Development

1. **Never hardcode a hex value for something a `--color-*` token already represents.** If no token fits, prefer a plain Tailwind palette utility (e.g. `bg-sky-400`) over inventing a new arbitrary hex, unless matching an exact existing brand color.
2. **Match the page-composition templates in §5.4–§5.6 exactly** for any new CRM/Admin page — same title class string, same spacing scale, same `ContainerTemplate`+`Form` structure for forms, same `TableData` usage for lists.
3. **Keep the Thai คำทับศัพท์ policy** (§9) for any new domain terminology.
4. **Don't reconnect data-visualization fills to `--color-primary`** (§2.6) — primary is a UI-chrome/brand color now, not a data color.
5. **When touching `SwitchLang`, preserve its `currentColor`-relative styling** so it keeps working on both the dark sidebar and any future light-background usage.
6. **Before editing `layouts/default.vue`'s `<main>` background or the outer shell gradient, re-read §2.5** — they're independent, and only `<main>`'s color is actually visible.
7. **If you add real Prompt Bold/Black font files**, remove the `-webkit-text-stroke` reinforcement hack from page titles (§3.1–3.2) — it was a workaround for missing font weights, not a permanent style choice.
8. **Keep `feature-spec.md`/`user-story.md`'s Status columns up to date** when you ship something they list as ⬜/🚧 — that traceability is only useful if it reflects reality.
9. **Use `var(--color-card-border)` for any new card/panel border**, not a fresh inline `ring-[var(--color-gray)]/N` — see §2.5.1.
10. **Any new entity that needs to be created/edited from more than one page goes through a Pinia store** (§8), following `stores/companies.ts`/`stores/contacts.ts` — not a page-local `ref([...MOCK_X])` copy.
