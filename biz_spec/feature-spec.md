# Feature Specification (SRS) — CRM for Sales Team

**Project codename:** IGearGeek Sales CRM
**Document type:** Software Requirements Specification (SRS)
**Prepared for:** Build with Claude Code
**Version:** 2.6 (adds Lead scoring/MQL-SQL classification, Deal→Quote/Contract→Project data hand-off prefilling, an Admin-configurable workflow notification-rules engine, and a sales-cycle/time-in-stage report on top of everything 2.5 already covered)
**Date:** 2026-08-21
**Companion doc:** `api-system-spec.md` translates the requirements below into the concrete backend API contract for a separate backend repo — cross-check both before implementing a new resource so the two never drift apart.

> **2026-08-21 update:** implemented FR-CRM-006/007 (Lead scoring, MQL/SQL), FR-CRM-046/047/048 (Quote/Contract/Project data hand-off), FR-CRM-099 (sales-cycle/time-in-stage report), and FR-CRM-100/101/102 (workflow notification rules, new §3.9a). Also corrected two pre-existing inaccurate statuses found in the process: FR-CRM-064 (CustomerProduct auto-creation on Won was a comment placeholder only, not built as previously stated) and FR-CRM-057 (the dashboard's `avg_sales_cycle_days` was a hardcoded `0` stub, not the partial implementation previously stated) — see those two rows below for detail.

> **Implementation status (as of 2026-08-17, features below current as of 2026-08-21):** Every requirement below now carries a **Status** column reflecting what actually exists in the codebase (`pages/`, `constants/mockData/`, `stores/`), not just what's specified. Legend: ✅ Built · 🚧 Partial (some but not all of the requirement) · ⬜ Not built. Lead/Deal/Company/Contact CRUD, the unified Kanban pipeline (Leads and Deals both render as cards, with drag-to-convert — both the drag flow and the manual "Convert to Deal" form now correctly mark the source Lead as converted), per-Deal payment tracking (§3.3), per-Deal/Contact/Company follow-up Tasks (§3.4), a filterable sales dashboard (now including a probability-weighted revenue forecast), Deal probability and lost-reason codes (§3.3), Quotes (line items now optionally linkable to a Product from the catalog, alongside plain free-text items) and Contracts (both real per-Deal stores, §3.5), a fully-editable Product Catalog + Customer↔Product tracking + Project tracking (§3.7), real backend RBAC enforcement (role-gated routes via `RequireRoles`), Lead/Deal/Company Attachments (§3.9), Company/Contact bulk import (Companies now deduping primarily by Website domain rather than name alone), bulk reassign/tag/archive on Deals and Leads, trash/restore now on Deals, Leads, Companies, and Contacts, a Reports section (lead-source conversion, customers-by-product-status, win/loss reasons, stalled deals, outstanding balance, quotes expiring soon, contracts stuck, projects at risk — FR-CRM-054/056/093–098), Admin-configurable pipeline stages, Lead sources, and quarterly sales quota (§3.8), a real frontend audit-log viewer, CSV **export** for Companies/Contacts/Deals/Products/Projects, least-open-load auto-assignment of new Leads, and server-side pagination/filtering on the Leads/Contacts/Companies/Deals-List views all now exist. Admin-side configurability of Tags/custom fields and Product Catalog (from a config screen, §3.8), and task due-date email notifications actually firing (SMTP must be configured) remain the notable nuances. See §9 for the full gap summary.

---

## บทบาทผู้ใช้และกรณีการใช้งาน (สรุปภาษาไทย)

> ส่วนนี้สรุปบทบาทผู้ใช้และตัวอย่างการใช้งานจริงเป็นภาษาไทย เพื่อให้ทีมงานฝั่งไทยเข้าใจภาพรวมได้เร็วก่อนเข้าสู่รายละเอียดทางเทคนิคด้านล่าง (ดูรายละเอียดฉบับเต็มเป็นภาษาอังกฤษที่ §2.2 และ §9)

### บทบาทผู้ใช้ (User Roles)

| บทบาท | หน้าที่หลัก |
|---|---|
| **แอดมิน (Admin)** | จัดการบัญชีผู้ใช้งานทั้งหมด กำหนดสิทธิ์การเข้าถึง และ (ในอนาคต) ตั้งค่าระบบ เช่น ขั้นตอน Pipeline, Tag, Product Catalog |
| **เซลล์ / ผู้ดูแลลูกค้า (Sales Rep / Account Manager)** | ดูแล Lead, Deal, บริษัท และผู้ติดต่อของตนเอง บันทึกการชำระเงินแต่ละงวด สร้างและติดตามงาน (Tasks) ที่ผูกกับ Deal/ผู้ติดต่อ/บริษัท |
| **หัวหน้าทีมขาย (Sales Manager)** | ดูภาพรวม Pipeline และผลงานของทั้งทีมผ่าน Dashboard, มอบหมาย/โยกย้าย Deal ระหว่างเซลล์, ติดตามงานที่เกินกำหนดของทั้งทีม |
| **การตลาด (Marketing)** | บริหาร Prospect (ลูกค้ามุ่งหวังก่อนเป็น Lead) บนบอร์ด Kanban ของตนเอง สร้าง/เชื่อมโยงบริษัทและผู้ติดต่อ แล้วส่งต่อให้เซลล์ด้วยการ "แปลงเป็น Lead" (เพิ่มเมื่อ 2026-09-01 — ดู §3.1a) |
| **ทีม Production (สิทธิ์จำกัด)** | อัปเดตสถานะและ Production Reference ของ Project ที่เชื่อมกับ Deal ของบริษัทลูกค้า (ดู §3.7 — พัฒนาแล้ว) |

### กรณีการใช้งานจริง (Use Cases) — อ้างอิงจากฟีเจอร์ที่สร้างเสร็จแล้ว

**กรณีที่ 1 — จาก Lead ถึง Deal ที่ปิดสำเร็จ พร้อมงานติดตามอัตโนมัติ**
1. เซลล์สร้าง Lead ใหม่จากช่องทางเว็บไซต์ พร้อมระบุแหล่งที่มา
2. Lead นี้ปรากฏเป็นการ์ดบนบอร์ด Kanban เดียวกับ Deal ทันที (ในคอลัมน์ "Lead") — เซลล์ลากการ์ดไปยังคอลัมน์ "Qualified" เพื่อตรวจสอบคุณสมบัติ แล้วลากต่อไปยัง "Proposition" เพื่อแปลงเป็น Deal โดยอัตโนมัติ พร้อมสร้างข้อมูลบริษัทและผู้ติดต่อใหม่ทันที ไม่ต้องกรอกฟอร์มแยก
3. เซลล์ลาก Deal ผ่านขั้นตอนต่าง ๆ บนบอร์ด Kanban จนถึงขั้น "เจรจาต่อรอง"
4. เมื่อกดปิด Deal สำเร็จ ("Won") ระบบจะสร้างงานติดตาม "นัดหมาย Kickoff Call" ให้อัตโนมัติ กำหนดส่งใน 3 วัน และมอบหมายให้เจ้าของ Deal ทันที
5. เซลล์บันทึกการชำระเงินงวดแรกในหน้า Deal และเห็นยอดที่ชำระแล้ว/ยอดคงเหลือแบบเรียลไทม์

**กรณีที่ 2 — การบริหารงานติดตาม (Follow-up Tasks) ของทั้งทีม**
1. เซลล์เปิดหน้า "งานติดตาม" (`/crm/tasks`) เพื่อดูงานทั้งหมดที่เกี่ยวข้องกับ Deal, ผู้ติดต่อ, และบริษัทของตนในที่เดียว
2. กรองงานตามสถานะ (ค้างดำเนินการ/เสร็จแล้ว) และผู้รับผิดชอบ หรือค้นหาด้วยชื่องาน
3. เมื่อกด "ทำเครื่องหมายว่าเสร็จแล้ว" ระบบจะถามยืนยันก่อนหนึ่งครั้ง เพื่อป้องกันการกดพลาด
4. เซลล์เปิดโหมด "เลือกรายการ" เพื่อเลือกงานหลายรายการพร้อมกัน แล้วทำเครื่องหมายว่าเสร็จหรือมอบหมายใหม่เป็นชุดเดียว
5. หัวหน้าทีมเห็นงานที่เกินกำหนด (สีแดง) ของทั้งทีมได้ทันทีผ่านวิดเจ็ต "Upcoming Follow-ups" บนหน้า Dashboard โดยไม่ต้องเปิดเข้าไปทีละ Deal

**กรณีที่ 3 — หัวหน้าทีมตรวจสอบภาพรวมยอดขาย**
1. หัวหน้าทีมเปิด Dashboard และเลือกช่วงเวลาที่ต้องการ (เดือนนี้/ไตรมาสนี้/ปีนี้ หรือกำหนดเอง)
2. ดูอัตราการปิด Deal สำเร็จ (Win Rate), มูลค่า Pipeline ที่เปิดอยู่, และอัตราส่วน Pipeline เทียบกับเป้าหมายยอดขาย
3. ดู Leaderboard ผลงานรายบุคคลของทีมเซลล์ พร้อมรายชื่อบัญชีลูกค้าที่ไม่ได้ติดต่อมานาน (โอกาส Upsell)
4. ค้นหา Deal, บริษัท, ผู้ติดต่อ หรือ Lead ที่ต้องการจากช่องค้นหาส่วนกลางด้านบนของทุกหน้า

> หมายเหตุ: Product/Project Tracking (§3.7), Quote และ Contract (§3.5) ใช้งานได้จริงแล้วในระบบปัจจุบัน — ดูรายละเอียดที่ §9

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for a **CRM system built for the Sales team**. It covers the full customer lifecycle from lead capture through to a won/lost deal, including quotes, contracts, communication history, tasks, sales reporting, and — critically — a running record of **which real Projects and Products each customer has with us**, so Sales always has an accurate, up-to-date picture of the relationship.

This document is written to be handed directly to an AI coding agent (Claude Code) as the source of truth for scaffolding and implementing the system.

### 1.2 Scope
In scope: everything a Sales/Account Management team needs to manage leads, contacts, companies, deals, quotes, contracts, communications, sales reporting, and a lightweight but real record of each customer's Products in use and Projects underway/completed with us.

**Explicitly out of scope:** full Project Management and Product Management *execution* tooling (Kanban boards, sprints, backlogs, roadmaps, release management, bug tracking). Those are owned and specified separately by the Production team's own tooling/spec. This system tracks the *existence and status* of a customer's Projects/Products for Sales visibility — it does not model or replace how Production actually plans and executes that work.

### 1.3 Intended Audience
- Engineering team / AI coding agent implementing the system
- Product owner (Jin, IGearGeek) reviewing and approving scope
- Sales team as end users

### 1.4 Definitions
| Term | Meaning |
|---|---|
| Lead | An unqualified potential customer |
| Deal / Opportunity | A qualified sales opportunity moving through pipeline stages |
| Account | A Company once it has at least one Deal (won or in progress) |
| Product | An item/service in IGearGeek's catalog that can be sold to a customer |
| Project | A real, named engagement/delivery between IGearGeek and a customer (e.g., "Acme Website Revamp"), tracked here at a summary level only — status, dates, and a reference — not managed in detail |
| Production reference | A text/link field pointing to the corresponding record in the Production team's own, separate Project/Product system |

---

## 2. System Overview

### 2.1 Product Perspective
The system is a web application, single workspace, organized around the sales pipeline **and** the customer's ongoing portfolio of Products and Projects with IGearGeek. Every Company record should answer, at a glance: what have they bought, what are we building/delivering for them right now, and what's the status.

### 2.2 User Roles
| Role | Description |
|---|---|
| **Admin** | Full system access, manages users, roles, pipeline/field/product-catalog configuration |
| **Sales Rep / Account Manager** | Owns Leads, Contacts, Deals, Quotes, Contracts, and keeps each customer's Product/Project records current |
| **Sales Manager** | Views team-wide pipeline, forecasts, reassigns deals, runs reporting across accounts/products/projects |
| **Marketing** | Added 2026-09-01 (§3.1a). Owns the pre-Lead Prospect funnel on its own Kanban board — creates/links Companies and Contacts before they qualify as a Lead, then hands off to Sales via a manual "Convert to Lead" action. No access to Leads/Deals/Quotes/Contracts/Payments. |
| **Production Team (limited/optional)** | Not a full user of this system. At most, updates the status/reference on a customer's Project record from their own tooling (manual entry, or later a simple API/webhook) so Sales sees progress without leaving the CRM. |

### 2.3 Assumptions & Dependencies
- Single organization (multi-tenant SaaS is out of scope for v1).
- Authentication via email/password initially; SSO (Google Workspace) is a stretch goal.
- Deployed as a web app (framework left to implementation, e.g., Next.js/Node + Postgres — Claude Code should propose stack in the implementation plan).
- Notifications assumed to be email + optionally Line/Slack webhook.
- The Production team's Project/Product system is a **separate system** with its own detailed spec (tasks, sprints, roadmaps); this CRM only stores summary records (status, dates, reference) about real customer Projects/Products, never a copy of Production's internal execution data.

---

## 3. Functional Requirements

Each requirement has an ID, description, and priority (**M**ust, **S**hould, **C**ould — MoSCoW).

### 3.1 Lead Management

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-001 | System shall allow creating a Lead with name, contact info, source (referral, web, event, ads, etc.), and notes. | M | ✅ **Updated 2026-08-24 (superseded same day):** the free-text `company_name` field is gone — Lead's company is now a real `company_id` FK, same as Deal/Contact (`api-system-spec.md` §3). `pages/crm/leads/create.vue` and `[id].vue` use a new `InputCompanySelect` component: pick an existing Company from a dropdown, or type a new name to create a real Company immediately (`POST /companies`, deduped case/whitespace-insensitively via a fresh server search before creating) and link to it — never a free-text stand-in. **Updated again same day:** `InputCompanySelect` now searches the server as the rep types (`GET /companies?search=`, debounced) rather than filtering a preloaded, capped list — see NFR-003's note on why a preloaded Company cache can't be relied on past ~200 companies. Also rolled out to every other Company picker in the app that had the same gap: Deal create, Contact create/edit, and the Task modal's "Relates to: Company" picker (`components/Crm/AddTaskModal.vue`) all use `InputCompanySelect` now too, and `GlobalSearch.vue`'s "Companies" quick-search result group searches the server the same way instead of filtering a preloaded list. `POST /leads/:id/convert` was updated to match: it now reuses the Lead's own `company_id` instead of always creating a fresh Company, closing the duplicate-Company gap this row used to note (see that endpoint's row and FR-CRM-004 in `api-system-spec.md` §3). Existing Leads' old `company_name` text was backfilled into real Company links (exact case-insensitive match, or a newly created Company where none matched) as part of this migration — see the backend's `backfillLeadCompanyIDs`. **Updated 2026-08-24 (later same day):** the "create a new Company" row in `InputCompanySelect` (`components/Input/CompanySelect.vue`) was only offered when the typed name matched zero existing companies (`create-item: { when: 'empty' }`) — a rep typing a near-duplicate name (e.g. "Custo Care" with "Custo Care Co., Ltd." already in the list) had no way to add a new Company alongside the partial matches shown. Changed to `when: 'always'` so the create row is always available regardless of matches; the existing server-side dedup check in `onCreate` still catches a true (case/whitespace-insensitive) duplicate before creating, so this only widens when the option is offered, not whether a duplicate can slip through. Applies everywhere `InputCompanySelect` is used (Lead, Deal, Contact create/edit, `AddTaskModal.vue`'s Company picker). |
| FR-CRM-002 | System shall support Lead status: New, Contacted, Qualified, Disqualified. | M | ✅ |
| FR-CRM-003 | System shall allow assigning a Lead to a Sales Rep, manually or via round-robin/rule (stretch). | M / C | ✅ manual assignment still available; a new Lead created with no explicit `assigned_to` is now auto-assigned via `pickAutoAssignee()` (`internal/handlers/leads.go`) — a least-open-load strategy among active Sales Reps (not literal index-based round robin) that only fires on Lead creation, leaving explicit-assignee flows (bulk-reassign, Kanban drag) untouched |
| FR-CRM-004 | System shall support converting a Qualified Lead into a Deal (and Contact/Company if new), either via a manual "Convert to Deal" action or automatically when a Lead card is dragged past "Qualified" on the unified Deals Pipeline board (FR-CRM-022). | M | ✅ both paths now call `POST /leads/:id/convert` (§3, api-system-spec.md) — the manual form used to call plain `POST /deals` instead, which silently never marked the Lead converted; fixed 2026-08-16. The manual "Convert to Deal" button on Lead Detail (`pages/crm/leads/[id].vue`) now confirms via modal before navigating to the Deal create form (irreversible — added 2026-09-02); drag-to-convert on the Kanban board is unchanged |
| FR-CRM-005 | System shall capture Lead source analytics (count/conversion rate by source). | S | ⬜ |
| FR-CRM-006 | System shall compute a numeric Lead Score from Admin-configurable weighted criteria (e.g., source, company size, budget stated, engagement/activity count), recalculated on relevant field/activity changes. | S | ✅ **2026-08-21** `Lead.Score`/`Lead.Classification` (`internal/models/lead.go`), weighted by Admin-configurable `LeadScoringCriterion` rows (`/admin/lead-scoring-criteria`, managed from the "Lead Scoring Criteria" card on `pages/admin/pipeline-config.vue`); recomputed on Lead Create/Update via `computeAndClassify()` (`internal/handlers/leads.go`). Score isn't capped to 0–100 as originally drafted — it's an open-ended sum of active criteria weights, which an Admin tunes directly rather than the system normalizing to a fixed range |
| FR-CRM-007 | System shall classify Leads as MQL (score above an Admin-configurable threshold) or SQL (manually marked "sales-ready" by a rep), with the classification visible on the Lead card/row. | S | ✅ **2026-08-21** threshold is `AppSettings.LeadScoringMqlThreshold` (Admin-editable from the same Sales Quota card, `PATCH /admin/settings`); "sql" is settable via a "Mark Sales Ready" button on `pages/crm/leads/[id].vue` (a manual override that persists regardless of score — the backend's `Update` handler only treats an explicit `"sql"` as a real override, any other value defers to the auto mql/none computation) — corrected 2026-08-21 from an earlier draft of this row that claimed a `classification` form field existed when it didn't yet. MQL/SQL badge shown on the Lead detail header, `pages/crm/leads/index.vue`'s list, and the Lead card in `pages/crm/deals/index.vue`'s Kanban board |

### 3.1a Prospect Management (Marketing)

A pre-Lead funnel entity, added 2026-09-01 so Marketing has its own CRM presence: working Companies/Contacts before they qualify as a Lead, tracking a marketing-specific status, and handing off to Sales via a deliberate manual action rather than Sales re-entering everything from scratch. Owned by the new **Marketing** role (§2.2), which has no access to Leads/Deals/Quotes/Contracts/Payments — its involvement ends at conversion.

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-105 | System shall allow Marketing to create/manage a Prospect (name, contact info, source, notes, optional linked Company) with a status of New, Engaging, Nurturing, or Disqualified, and view them on a dedicated Kanban board (`pages/crm/prospects/index.vue`), separate from the unified Deals/Leads Pipeline board (FR-CRM-022). | M | ✅ `internal/models/prospect.go`, `POST`/`GET`/`PUT`/`DELETE /prospects*` (`api-system-spec.md` §3a). Status is a fixed enum, not admin-configurable — mirrors `LeadStatus`, not the admin-configurable `PipelineStage` used by Deals, keeping scope down and consistent with how Lead itself works. **Updated 2026-09-01** — `source` now validates against Prospect's own admin-configurable `ProspectSourceOption` list (`/admin/prospect-sources`, seeded with Social Media/LINE OA/Email Campaign/Content-SEO/Cold Outreach/Marketing Campaign), not Lead/Deal's shared `LeadSourceOption` — Marketing's actual channel mix didn't overlap well with Sales's lead-capture sources. Managed from a new "Prospect Sources" tab on `pages/admin/pipeline-config.vue`. **Updated 2026-09-02** — brought `pages/crm/prospects/[id].vue` to parity with Contact/Company/Deal's detail pages: an Activity timeline (read-only display, same as those three — logging an Activity has no "Add" UI anywhere in the app yet, Prospect included, not a gap unique to it), a directly-editable Tags field (backend `prospectForm` gained a `tags` field so this persists, unlike Lead's own form which only exposes tags via bulk-tag), and a "View Company" quick link when a Company is linked. **Updated 2026-09-02 (later)** — "View Company" on Prospect Detail (and the same link on Contact Detail) now opens `CrmCompanyPreviewModal` (a read-only quick-view) instead of navigating away via `NuxtLink`, since navigating away lost the in-progress edit form; the modal offers an "Open Full Page" button for anyone who wants the full Company Detail page. |
| FR-CRM-106 | System shall support converting a Prospect into a Lead (and Contact/Company if new) via a manual "Convert to Lead" action, mirroring FR-CRM-004's Lead→Deal pattern one funnel stage earlier: resolve-or-create Company → resolve-or-create Contact → create the Lead with a back-reference (`Lead.prospect_id`) → carry over Attachments → mark the Prospect `Converted`, all in one transaction. | M | ✅ `POST /prospects/:id/convert` (`internal/handlers/prospects.go`), `409 CONFLICT` guard against double-conversion via `Prospect.converted_lead_id`, same shape as `Lead.converted_deal_id`. `status: 'Converted'` is also rejected on plain `POST`/`PUT /prospects*` (`422`) — it's only reachable through this Convert endpoint, never settable directly, so a client can't fake the converted state with no Lead behind it. **Updated 2026-09-02** — the "Convert to Lead" button on Prospect Detail now confirms via modal before calling this endpoint, since the conversion is irreversible (see `biz_spec/ux-ui-guidelines/modal.md`'s Confirm Delete section, "Convert" case). |

### 3.2 Company & Contact Management

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-010 | System shall allow creating/editing/archiving Company records (name, industry, size, website, address, notes, tags). | M | ✅ |
| FR-CRM-011 | System shall allow creating/editing/archiving Contact records linked to a Company (name, job title, email, phone, tags). | M | ✅ |
| FR-CRM-012 | System shall support multiple Contacts per Company, with one marked as "Primary." | M | 🚧 multiple contacts per company work; explicit "Primary" flag not confirmed |
| FR-CRM-013 | System shall allow tagging/segmenting Companies and Contacts (e.g., by industry, tier, product interest). | S | ✅ |
| FR-CRM-014 | System shall support bulk import of Contacts/Companies via CSV, with duplicate detection by email/domain. | C | 🚧 built for a specific FlowAccount export format (CSV/XLS/XLSX, not CSV-only), via `CrmImportContactsModal`; Company duplicate detection now dedupes primarily by normalized Website domain, falling back to a case-insensitive/whitespace-trimmed name match when either side has no website (`internal/handlers/import.go`'s `findExistingCompany` — Company has no dedicated email field, so this is domain-based, not literally email); Contact import still dedupes by email only |
| FR-CRM-015 | System shall show a unified profile page per Company: contacts, deals (open/won/lost), communication timeline, quotes, contracts, tasks, **Products in use, and Projects (past and current)** — see §3.7. | M | 🚧 contacts, deals, activity feed, Tasks, Products, and Projects tabs all shown; Quotes and Contracts are still Deal-scoped only, not rolled up onto the Company page |

### 3.3 Pipeline & Deal Management

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-020 | System shall support Deals/Opportunities with title, value, currency, expected close date, owner (Sales Rep), and linked Company/Contact. | M | ✅ |
| FR-CRM-021 | System shall support a customizable pipeline of stages (e.g., Lead → Qualified → Proposition → Negotiation → Won/Lost). | M | ✅ Admin-configurable via the `PipelineStage` model and `/admin/pipeline-stages` CRUD routes, seeded from the old hardcoded list on first run; managed from `pages/admin/pipeline-config.vue` / `stores/pipelineStages.ts`. The old `DEAL_STAGE_OPTIONS` frontend constant is removed — "Proposition" remains the display label for the `Proposal Sent` stage value |
| FR-CRM-022 | System shall provide a Kanban board view of Deals per stage, with drag-and-drop to change stage. Unconverted Leads also render as cards in the Lead/Qualified/Lost columns (Disqualified Leads land in Lost); dragging a Lead card into Proposal Sent/Negotiation/Won auto-converts it into a real Deal (FR-CRM-004). | M | ✅ |
| FR-CRM-023 | System shall record a reason code when a Deal is marked "Lost" (e.g., price, timing, competitor, no budget). | S | ✅ `Deal.LostReason` enum (`internal/models/deal.go`: price/timing/competitor/no_budget/other), required by `internal/handlers/deals.go` validation once a Deal resolves to Lost — resolution now prefers the configured `PipelineStage` row's `IsLostStage` flag (via `utils.IsLostStage`) rather than a hardcoded `"Lost"` string match, so a renamed/custom Lost stage is still detected correctly; frontend conditional select on `pages/crm/deals/[id]/index.vue` |
| FR-CRM-024 | System shall support Deal probability (%) either manually set or defaulted by stage, feeding into forecast calculations. | S | ✅ `Deal.Probability *int`, defaulted per-stage via `StageDefaultProbability` but always manually overridable; frontend probability input on `pages/crm/deals/[id]/index.vue`; feeds `/dashboard/summary`'s `forecasted_revenue` (FR-CRM-052) |
| FR-CRM-025 | System shall allow re-assigning a Deal's owner, with history of prior owners retained. | S | 🚧 owner/assignee is editable individually (`PATCH /deals/:id/reassign`) or in bulk across a multi-select (`PATCH /deals/bulk-reassign`, Admin/Sales Manager only), each writing a `reassigned`/`bulk_reassigned` audit-log entry (§9's audit log); there's no dedicated "prior owners" history view distinct from the audit log |
| FR-CRM-026 | System shall support multiple open Deals per Company (e.g., upsell alongside an existing account). | M | ✅ |
| FR-CRM-027 | System shall allow recording one or more partial Payments against a Deal (amount, date paid, payment method, note), since a Deal's total value is often collected across multiple installments rather than a single payment. | M | ✅ |
| FR-CRM-028 | The Deal detail page shall show total amount paid to date and remaining balance (Deal value minus sum of Payments), computed live as Payments are added or removed. | M | ✅ |

### 3.4 Communication & Activity Tracking

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-030 | System shall log calls, emails, and meeting notes against a Contact/Company/Deal, shown as a chronological timeline. | M | ✅ |
| FR-CRM-031 | System shall support manually logging an activity (type, date, summary, participants). | M | 🚧 timeline display exists; a manual "add activity" entry form is not confirmed |
| FR-CRM-032 | System shall support Tasks/Reminders/Follow-ups assigned to a Sales user, with due date, priority, and description, linked to a Deal/Contact/Company, and notification on due. | M | 🚧 Tasks fully built — linked to Deal/Contact/Company via `stores/tasks.ts`, with per-record Tasks tabs, a dedicated all-tasks view (`/crm/tasks`) with filtering/bulk mark-done/bulk reassign, a confirm-before-marking-done dialog, and an auto-created follow-up task when a Deal is marked Won; "notification on due" is now built as email — a new `internal/notifier` package (15-minute ticker) sends a reminder via `internal/utils/mailer.go` and records it on `Task.NotifiedAt`, degrading safely (no-op, no crash) when no `SMTP_*` env vars are configured; push notification is still not built, and email needs real SMTP credentials configured to actually send. **updated 2026-08-22** — Task gained `priority` (Low/Medium/High, display-only triage label, defaults Medium) and a free-text `description` separate from `title`, editable via a new `PATCH /tasks/:id` (title/description/due_date/priority/assigned_to — `related_type`/`related_id` stay immutable, same as before; status changes still go through the dedicated toggle endpoint) — see `api-system-spec.md` §7.6. |
| FR-CRM-033 | System shall support email integration (BCC-to-log or IMAP sync) to auto-capture email threads against a Contact — stretch goal. | C | ⬜ |
| FR-CRM-034 | System shall allow @mentioning a teammate in an activity note, triggering a notification. | S | ⬜ |

### 3.5 Quotes & Contracts

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-040 | System shall support creating a Quote/Proposal with line items, unit price, quantity, discount, and total, attached to a Deal. | M | ✅ real per-Deal Quote store/API with description/qty/price line items and a computed total. **Updated 2026-08-22** — Quote gained a whole-quote `scope_of_work` free-text narrative (deliverables/phases/terms), distinct from each line item's own short `description`; line-item descriptions are now also multi-line. **Updated 2026-08-23 (quotation-builder rebuild)** — the discount gap is closed: each `QuoteItem` now carries its own `discount_percent` (0-100, reduces that line's total) alongside a whole-quote `discount_total`, both editable in `pages/crm/quotes/[id].vue` and feeding the live totals breakdown (`useQuoteTotals`, mirroring the backend's `utils.ComputeQuoteTotals`) — see `api-system-spec.md` §7.4. |
| FR-CRM-041 | System shall support Quote status: Draft, Sent, Accepted, Rejected, Expired, with a validity date. | M | ✅ **corrected 2026-08-22** — this row was stale; `Expired` is implemented as a read-derived status (`Quote.EffectiveStatus()` in `internal/models/quote.go`), computed when a `Sent` quote's `validity_date` has passed, without mutating the stored `draft`/`sent`/`accepted`/`rejected` value. Applied consistently on List/Get/Create/Update/Export-PDF (`internal/handlers/quotes.go`'s `withEffectiveStatus`/`withEffectiveStatuses`) — see `api-system-spec.md` §7.4. |
| FR-CRM-042 | System shall support exporting a Quote as a PDF using a company template. | S | 🚧 `GET /quotes/:id/export-pdf` generates a real PDF (`github.com/go-pdf/fpdf`) — line items, Deal/Company/Contact header, status, validity date — but it's a plain unbranded layout, not a company template. **Updated 2026-08-22** — now also renders `scope_of_work` as a wrapped paragraph above the line-items table; the shared `RenderLineItemsTable` (also used by Contract's export) now wraps multi-line item descriptions onto properly-sized rows instead of silently clipping them to a fixed single-line cell height. |
| FR-CRM-043 | System shall support a Contract record with status (Draft, Sent, Signed, Expired) attached to a Deal. | S | ✅ real per-Deal Contract store/API + a Contracts tab on the Deal detail page, optionally linked to one of the Deal's Quotes for pricing |
| FR-CRM-044 | System shall support attaching signed documents (file upload) to a Contract. | M | ✅ `POST /contracts/:id/upload` sets the signed file + date and flips status to Signed |
| FR-CRM-045 | System shall require a Contract be marked "Signed" before a Deal can be marked "Won" (configurable, not hard-enforced by default). | C | ✅ **2026-08-22** — `AppSettings.RequireSignedContractBeforeWon` (Admin toggle, `admin.pipelineConfig.salesQuota` section — default `false`, matching "not hard-enforced by default"). When enabled, `DealHandler` blocks a Deal moving into Won (via `Create`, `Update`, or the Kanban `UpdateStage`) unless it already has ≥1 Contract with `status: 'signed'` — `internal/handlers/deals.go`'s `validateContractSignedBeforeWon`. |
| FR-CRM-046 | "New Quote" action from a Deal shall pre-fill Deal value, rather than opening a blank form. | M | ✅ **2026-08-21**, updated **2026-08-23**. **2026-08-23 rebuild**: the modal (`CrmAddQuoteModal`) that used to own this behavior was retired and replaced by two full pages — `pages/crm/quotes/create.vue` (a deliberately minimal create step: validity date, status, Scope of Work, line items) and `pages/crm/quotes/[id].vue` (the full quotation-builder editor: reference number, issue/due dates, credit days, price type, per-item discount %, VAT/WHT toggles with a live totals breakdown via `useQuoteTotals`, notes/internal notes, and an Attachments section reusing the generic Attachment model with `related_type: 'quote'`) — see `api-system-spec.md` §7.4 for the full field list. The pre-fill behavior itself is unchanged: create.vue pre-fills Scope of Work with `deal.title` and seeds one line item with `qty: 1, price: deal.value` (description blank, optional, never blocks Save); Company/Contact/Sales Rep/currency are read-only, derived from the parent Deal on the edit page, never duplicated as new Quote fields. Saving on create.vue redirects straight into the edit page for the rest of the fields. Each row still starts with the explicit "สโคป/ฟีเจอร์" (Scope/Feature) vs "แพ็กเกจราคา" (Pricing Package) toggle from the 2026-08-23 (pre-rebuild) update, now living in the shared `components/Crm/QuoteItemsEditor.vue` used by both pages. The editor's "Project" field is a read-only display of whichever Project already links back to the Quote's Deal (if any) — not a picker; Quote gained no `project_id` field, since Projects are created downstream of a Deal (typically post-Won/Signed, FR-CRM-048/068), not chosen at Quote-creation time. |
| FR-CRM-047 | "New Contract" action shall default a sensible Quote link, rather than opening a blank form. | M | ✅ **2026-08-21** `CrmAddContractModal` defaults `quote_id` to the most recently Accepted quote on the Deal (falling back to the most recent quote overall) when opened. Company/Contact/value aren't separately pre-filled — Contract has no such fields, only `deal_id`/`quote_id`, same reasoning as FR-CRM-046 |
| FR-CRM-048 | Marking a Contract "Signed" shall prompt to auto-create the linked Project (pre-filled from the Contract's Deal), mirroring the existing Deal-Won → Create Project prompt (FR-CRM-068). | S | ✅ **2026-08-21** `pages/crm/deals/[id]/contracts.vue` opens the same `CrmAddProjectModal` used by the Deal-Won flow whenever a Contract create or signed-document upload resolves to `status: 'signed'` |

> **Uploading a PDF quote (§6.1's Upload path off FR-CRM-040/041/042) now best-effort extracts structured data, not just a file keeper. Added 2026-08-23.** Previously (and still, for any other PDF) `POST /deals/:dealId/quotes/upload` only ever stored the file and left every field blank/default for manual entry. When the uploaded PDF is a FlowAccount quotation export specifically, `internal/utils/flowaccount_extract.go` now also parses its reference number, issue date, job title (→ `scope_of_work`), line items (incl. discount %), VAT/WHT, and notes/payment terms straight into the created Quote, recording what it found (or couldn't) on `extraction_status`/`extraction_warnings` (`api-system-spec.md` §7.4). This is purely additive, never blocks the upload, and never auto-Sends anything — the rep lands on `pages/crm/quotes/[id].vue` same as any other Quote and reviews/corrects before Sending, same trust model as the Deal pre-fill (FR-CRM-046); a `pages/crm/quotes/[id].vue` banner surfaces `extraction_status: 'partial'`'s warnings (e.g. a recomputed total that doesn't match the PDF's own printed one) or a plain "couldn't read this automatically" notice for `'failed'`. Only FlowAccount's export template is supported — a different quotation source's PDF simply falls back to today's file-only behavior.

### 3.6 Reporting & Dashboards

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-050 | System shall provide a pipeline dashboard: deal count and value per stage. | M | ✅ |
| FR-CRM-051 | System shall calculate and display win rate (won ÷ (won + lost)) over a selectable date range. | M | ✅ dashboard's Time Period presets (This Month/Quarter/Year, Last 6/12 Months) and free-form date-range picker both drive the win rate stat |
| FR-CRM-052 | System shall provide a revenue forecast (sum of open Deal value × probability) by month/quarter. | S | 🚧 `/dashboard/summary`'s `forecasted_revenue` sums open Deal value × probability (`internal/handlers/dashboard.go`) and renders as a "Forecasted Revenue" stat card on `pages/index.vue`; it's a single running total, not yet broken out by month/quarter |
| FR-CRM-053 | System shall provide per-rep leaderboard: deals won, revenue closed, activities logged. | S | 🚧 "Team Performance" leaderboard shows won deal count, revenue closed, and win rate per rep; activity-logged count not included |
| FR-CRM-054 | System shall provide a lead-source report showing conversion rate by source. | S | ✅ `pages/crm/reports/lead-source.vue`, backed by `GET /reports/lead-source-conversion` (Admin/Sales Manager only) |
| FR-CRM-055 | System shall allow filtering all reports by date range, Sales Rep, and Company tag/segment. | S | ✅ the Dashboard and both new report pages now filter by date range, Sales Rep (`assigned_to`), and Company tag, alongside the Dashboard's existing Business Unit/Channel filters |
| FR-CRM-056 | System shall provide a report answering "which customers use Product X" and "which customers have a Project in status Y" (see §3.7). | S | ✅ `pages/crm/reports/customer-product-status.vue`, backed by `GET /reports/customers-by-product-status` (Admin/Sales Manager only). Do not confuse with the dashboard's Business Unit/Project/Product filter, which filters Deals by a lightweight tag field on the Deal itself, not this real CustomerProduct/Project relationship |
| FR-CRM-057 | System shall display average deal size and average sales cycle length (days from Deal creation to expected/actual close) for won Deals. | S | ✅ **fixed 2026-08-21** average sales cycle length on `/dashboard/summary` (`avg_sales_cycle_days`) was a hardcoded stub returning `0` (found and flagged earlier the same day) — `internal/handlers/dashboard.go`'s `Summary()` now calls the same `fetchSalesCycle()` computation the FR-CRM-099 report uses (refactored to take plain `assignedTo`/`dateFrom`/`dateTo` params instead of a `*fiber.Ctx` so both handlers can share it), rounded to the nearest whole day. Only `assigned_to`/`date_from`/`date_to` are honored, not `business_unit`/`channel`/`company_tag` (same precedent as `annual_revenue_actual` not applying every dashboard filter) |
| FR-CRM-058 | System shall display a pipeline coverage ratio (open pipeline value ÷ a configured sales quota/target) with an on-track/below-target indicator. | S | ✅ quota is now Admin-configurable via the `AppSettings` singleton row (`internal/models/settings.go`) and `GET`/`PATCH /admin/settings` (Admin-only, `internal/handlers/settings.go`); `dashboard.go`'s `quarterlySalesTarget()` reads it (falling back to the old hardcoded default only if the row is somehow missing) instead of the previous hardcoded constant. Edited from a new "Sales Quota" card on `pages/admin/pipeline-config.vue` (`stores/appSettings.ts`) |
| FR-CRM-059 | System shall provide a trailing revenue trend chart (won revenue by month) and a win-rate breakdown segmented by customer industry. | S | ✅ |
| FR-CRM-091 | System shall display an Admin-configurable annual company revenue goal, tracked against actual Won Deal value realized so far in the current calendar year, with an on-track/below-target indicator (pro-rated for how far through the year it is, not a flat 100% bar), plus a month-by-month cumulative-actual-vs-goal-pace trend. Changes to the goal (like the quarterly quota, FR-CRM-058) are audit-logged. | S | ✅ goal is Admin-configurable via the same `AppSettings` singleton row as FR-CRM-058's quarterly quota (`annual_revenue_goal` column, `internal/models/settings.go`), same `GET`/`PATCH /admin/settings` endpoints — both fields now write a `SaveWithAudit` `"settings"`/`"updated"` entry when either actually changes (previously a plain `db.Save`, an audit-trail gap since FR-CRM-058 shipped), and the row's `updated_at` is surfaced in the Admin UI as a "last updated" hint since neither figure resets itself on a new quarter/year. A real change also calls `dashboard.go`'s `InvalidateDashboardCache()`, since `GET /dashboard/summary` caches its response for 30s and a settings PATCH is otherwise the one write path that changes that response without touching the `deals` table the cache is implicitly kept fresh against. `dashboard.go`'s `annualRevenueTrend()` buckets cumulative Won Deal value by month (Jan through the current month, company-wide, ignoring the dashboard's own filter bar — same convention as the Revenue Trend chart) alongside a straight-line goal-pace figure per month; its last point doubles as `annual_revenue_actual`, from which `Summary` derives `annual_revenue_progress_ratio`. Edited from the same "Sales Quota & Revenue Goals" card on `pages/admin/pipeline-config.vue`; displayed as an "Annual Revenue Goal" stat card next to Pipeline Coverage plus an "Annual Goal Pace" bar chart (bars = cumulative actual, dashed line = goal pace) on `pages/index.vue` |
| FR-CRM-093 | System shall provide a Win/Loss Reasons report: closed Deals grouped by outcome (Won, or the `lost_reason` code the Deal was closed with). | S | ✅ `pages/crm/reports/win-loss.vue`, backed by `GET /reports/win-loss-reasons` (Admin/Sales Manager only, date-range + Sales Rep filters per FR-CRM-055) |
| FR-CRM-094 | System shall provide a Stalled Deals report: open Deals with no logged Activity for at least a configurable number of days. | S | ✅ `pages/crm/reports/stalled-deals.vue`, backed by `GET /reports/stalled-deals?min_days=` (default 14) — `last_activity_at` falls back to the Deal's `created_at` when it has no Activity logged at all |
| FR-CRM-095 | System shall provide an Outstanding Balance report: Won Deals whose recorded Payments total less than the Deal's value. | S | 🚧 `pages/crm/reports/outstanding-balance.vue`, backed by `GET /reports/outstanding-balance` — a flat "who still owes what" list, not date-bucketed 30/60/90-day aging, since `Payment` has no `due_date` field (only `paid_at`, when an installment was actually received); true aging-by-due-date is a follow-up once that field exists |
| FR-CRM-096 | System shall provide a Quotes Expiring Soon report: Sent quotes whose validity date falls within a configurable upcoming window. | S | ✅ `pages/crm/reports/quotes-expiring-soon.vue`, backed by `GET /reports/quotes-expiring-soon?within_days=` (default 7) — the forward-looking mirror of the existing read-derived "Expired" quote status (FR-CRM-062's Quote status work) |
| FR-CRM-097 | System shall provide a Contracts Stuck report: Draft/Sent Contracts unsigned for at least a configurable number of days. | S | ✅ `pages/crm/reports/contracts-stuck.vue`, backed by `GET /reports/contracts-stuck?min_days=` (default 14) — Contract has no start/end date to track true expiration by, only `signed_date`, so this tracks staleness before signature instead |
| FR-CRM-098 | System shall provide a Projects at Risk report: Projects past their target end date that are not yet Completed or Cancelled. | S | ✅ `pages/crm/reports/projects-at-risk.vue`, backed by `GET /reports/projects-at-risk` |
| FR-CRM-099 | System shall report average time-in-stage and total sales-cycle length (extending FR-CRM-057's single average), broken out by pipeline stage, Sales Rep, and Lead source. | S | ✅ **2026-08-21** `GET /reports/sales-cycle` (`internal/handlers/reports.go`'s `fetchSalesCycle`), `pages/crm/reports/sales-cycle.vue`. Derived entirely from "deal" `stage_changed` audit log entries — walks each Deal's transitions in order, measuring the gap between consecutive ones (and from `Deal.CreatedAt` to the first one); only completed segments count, not a Deal's current still-open stage. FR-CRM-057's `/dashboard/summary` stat card has since been wired to this same computation (fixed 2026-08-21, see that row below) — both fields now agree |
| FR-CRM-092 | System shall allow Admin to set a specific quarterly sales target for any individual (year, quarter) period — past, current, or future, including future years — rather than only one flat figure always applied to "whatever quarter it currently is". A period with no specific target set shall fall back to FR-CRM-058's quarterly quota. Changes are audit-logged, same as FR-CRM-058/091. | S | ✅ new `SalesTarget` model (`internal/models/sales_target.go`, one row per unique `(year, quarter)`) with full Admin CRUD via `GET`/`POST`/`PATCH`/`DELETE /admin/sales-targets` (Admin-only, `internal/handlers/sales_targets.go`); each create/update/delete writes a `SaveWithAudit` `"sales_target"` entry and calls `InvalidateDashboardCache()`, same plumbing as FR-CRM-058/091's settings PATCH. `dashboard.go`'s `pipeline_coverage_ratio` now resolves its target via `currentQuarterTarget()`: looks up a `SalesTarget` row for the current calendar `(year, quarter)` first, and only falls back to `AppSettings.QuarterlySalesTarget / 4` (FR-CRM-058's flat figure, unchanged) if none exists — additive, not a breaking change to FR-CRM-058's behavior for any Admin who never uses this. Unlike FR-CRM-058's field (an annual figure implicitly divided by 4), a `SalesTarget.target_value` is the true quarterly number directly. Managed from a new "Quarterly Sales Targets" card on `pages/admin/pipeline-config.vue` (`stores/salesTargets.ts`, `components/Crm/SalesTargetModal.vue`) — a Year/Quarter/Target Value table with add/edit/delete, each row badged Current/Upcoming/Past relative to today. Delete is a hard row delete (unlike PipelineStage's soft `is_active` flip) since nothing else references a `SalesTarget` row by ID; removing one simply reverts that period to the flat fallback |

### 3.7 Customer Portfolio: Real Products & Projects Tracking

This is the core addition that makes the CRM follow the **real, ongoing relationship** with each customer, not just the sales pipeline up to Won/Lost. It stays intentionally lightweight (status + dates + reference), so it does not duplicate the Production team's own detailed execution system.

> **Status: ✅ Built.** Product Catalog (`stores/products.ts`, full CRUD including edit), CustomerProduct (`stores/customerProducts.ts`, Company detail page's Products tab), and Project (`stores/projects.ts`, `pages/crm/projects/index.vue`, Company detail page's Projects tab) all exist and are wired up. The Deal detail page's "Create Project" action (shown after marking a Deal Won) creates a real Project linked to that Deal's `company_id`/`deal_id` via `CrmAddProjectModal`. The standalone Projects list, the Company detail Projects tab, and the Contact detail page (Projects belonging to the contact's company, since Project has no `contact_id` of its own) can all link a new Project to an existing Deal via an optional Deal picker in the same modal. Known gap: once a Project is linked to a Deal, that link isn't visible or editable anywhere in the UI afterward — the Deal picker only shows at creation time, and no Project list/card displays its linked Deal.

**Product Catalog**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-060 | System shall maintain a Product Catalog (id, name, category, description, active flag) representing the products/services IGearGeek offers. | M | ✅ |
| FR-CRM-061 | Any authenticated role shall be able to create/edit/deactivate Product Catalog entries. | M | ✅ |
| FR-CRM-062 | Quote line items (§3.5) shall reference a Product from the catalog rather than free-text, where possible. | S | 🚧 optional, hybrid — an Add Quote line item can now pick a Product from the catalog (`components/Crm/AddQuoteModal.vue`), which snapshots that Product's current name/price into the item's description/price at save time (not a live reference, so later Product edits don't retroactively change a saved Quote); leaving the picker unset still behaves as pure free-text, unchanged from before. `Product.Price` and `QuoteItem.ProductID` (optional) back this (`internal/models/product.go`, `internal/models/quote.go`) |

**Customer ↔ Product tracking**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-063 | System shall track, per Company, which Products they are associated with via a Customer-Product record: Product, status (Interested, Trial, Active, Churned), start date, end date (nullable), and the source Deal (if any). | M | ✅ **updated 2026-08-22** — the manual-add modal (`AddCustomerProductModal.vue`) now exposes `start_date` (defaults to today) and an optional Deal picker (`source_deal_id`, scoped to the current company) at creation time, and `end_date` in edit mode; `end_date` stays edit-only (matches `PATCH /customer-products/:id`'s immutability of `company_id`/`product_id`, §8.2). Also fixed a backend bug where `POST /companies/:companyId/products` parsed `start_date` from the request but never applied it to the record, silently persisting Go's zero-value date regardless of what was sent — `internal/handlers/products.go`'s `AddForCompany` now applies it (or defaults to now). |
| FR-CRM-064 | When a Deal is marked "Won," the system shall automatically create/update Customer-Product records for each Product on the Deal's Quote, setting status to "Active." | M | ⬜ **superseded 2026-08-22 — will not be built, by business decision, not a gap.** Confirmed with the business owner: `Product`/`CustomerProduct` represent the company's *own* packaged products/subscriptions — sold via a Contract and charged once or annually per package, tracked manually (FR-CRM-065) independent of the Deal pipeline's timing. A Won Deal is much more often a **custom software project** (quoted/scoped per FR-CRM-046/FR-CRM-062's `scope_of_work`, becoming a `Project` per FR-CRM-068), not a catalog-product sale — auto-creating a CustomerProduct on every Won Deal would misrepresent most Won deals as product purchases. Manual CustomerProduct creation (already built) is the correct, intentional flow for the minority of deals that genuinely are product/package sales. (Previously — 2026-08-21 — this row was corrected from an overstated 🚧 to an accurate ⬜ "not built"; this update goes further and marks it as intentionally out of scope, not a pending gap.) |
| FR-CRM-065 | Sales/Admin shall be able to manually add, edit, or change the status of a Customer-Product record independent of any Deal (e.g., marking a product "Churned" after a renewal is lost). | M | ✅ |
| FR-CRM-066 | The Company profile page shall list all Products currently and previously associated with that customer, with status and dates. | M | ✅ |

**Customer ↔ Project tracking**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-067 | System shall track, per Company, one or more Project records: name, optional linked Deal, status (Not Started, In Progress, On Hold, Completed, Cancelled), start date, target end date, and an optional Production Reference (free-text ID and/or URL pointing into Production's own system). | M | ✅ **updated 2026-08-22** — the `name` field is now a creatable combobox (`AddProjectModal.vue`), suggesting previously-used Project names (scoped to the current company when known, via a new `projectNames` store getter) while still accepting any new typed value — a UI convenience for naming consistency, not a data-model change; `name` remains a plain string. |
| FR-CRM-068 | System shall allow creating a Project record manually, or prompting to create one when a Deal is marked "Won." | M | ✅ |
| FR-CRM-069 | The Project's status/reference fields shall be editable by Sales/Admin by default; automatic sync from Production's system via webhook/API is a later-phase stretch goal, not part of this spec. | S | ✅ manual edit only, as specified — no webhook sync (not required) |
| FR-CRM-070 | The Company profile page shall list all Projects (past and current) for that customer, sorted by most recent, each showing status and the Production Reference link if present. | M | ✅ |
| FR-CRM-071 | This system shall NOT model Tasks, Sprints, Milestones, Backlogs, or Feature Requests as first-class entities. A Project here is a summary record for Sales visibility, not a delivery management tool — detailed execution belongs entirely to Production's own system. | M | ✅ trivially true — no such entities exist |

### 3.8 Admin & System Settings

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-080 | System shall support role-based access control per §2.2 roles, configurable per user. | M | ✅ backend `internal/middleware/auth.go`'s `RequireRoles` gates specific routes (deal reassign, project creation, attachments, reports) by role; frontend mirrors this via `useRole`/`hasRole` to hide actions the backend would reject. Not user-configurable — roles are fixed per §2.2, not admin-defined |
| FR-CRM-081 | System shall allow Admin to customize pipeline stages, Lead sources, tags, Product Catalog, and custom fields on Deal/Company/Contact. | S | 🚧 pipeline stages and Lead sources are now Admin-configurable — new `PipelineStage`/`LeadSourceOption` backend models, `/admin/pipeline-stages` and `/admin/lead-sources` CRUD routes (seeded from the old hardcoded lists on first run), frontend `pages/admin/pipeline-config.vue` / `stores/pipelineStages.ts` / `stores/leadSources.ts`; the old `DEAL_STAGE_OPTIONS`/`CHANNEL_OPTIONS`/`LEAD_SOURCE_OPTIONS` frontend constants were removed as dead code. Tags and custom fields on Deal/Company/Contact are still not Admin-configurable; Product Catalog itself is manageable (§3.7) but not from this Admin config screen |
| FR-CRM-082 | System shall maintain an audit log of key record changes (who changed what, when), at minimum for Deal stage changes, Won/Lost status, and Project/Product status changes. | S | ✅ `internal/utils/auditlog.go`'s `SaveWithAudit` writes a real audit row for Deal stage changes, Deal reassignment, Project status changes, and CustomerProduct status changes (`internal/handlers/projects.go`, `internal/handlers/products.go`); the frontend `pages/admin/activity-log.vue` was rewritten from a static mock feed to consume the real `GET /audit-log` endpoint via `stores/auditLog.ts`, filterable by entity type/date range, Admin-gated, with a before/after diff view |
| FR-CRM-083 | System shall support data export (CSV) for Companies, Contacts, Deals, Products, and Projects. | C | ✅ backend `GET /{companies,contacts,deals,products,projects}/export` endpoints (Admin/Sales Manager gated, same as trash/bulk-actions), streaming the full non-deleted dataset (not paginated); frontend export buttons + `composables/utils/useCsvExport.ts` |
| FR-CRM-084 | System shall support email notification integration (SMTP) at minimum; Slack/Line webhook is a stretch goal. | S | ⬜ `useNotify` only drives in-app toasts, no outbound email/SMTP/webhook |
| FR-CRM-103 | System shall provide a role-aware in-app Guideline page walking each role through its core workflows (Lead→Deal hand-off, Subscription follow-up, Project delivery/payment milestones, loyalty/upsell), so new staff can onboard without external documentation. | C | ✅ `pages/admin/guideline.vue`, tabbed by role (`Sales Rep`/`Sales Manager`/`Admin`/`Production`, defaulting to the viewer's own role), content sourced from `locales/admin/guideline/{en,th}.ts`; visible to all authenticated roles (not Admin-gated) since it's onboarding reference material, not privileged data |
| FR-CRM-104 | System shall allow Admin to configure a Company revenue-size bracket list (separate from the existing headcount-based Size), so customers can be categorized by revenue for more precise segmentation/reporting. | C | ✅ `RevenueSizeOption` backend model, `/admin/revenue-sizes` CRUD routes (Admin-only, seeded with 5 THB brackets on first run, same pattern as `CompanySizeOption`/FR-CRM-081), new validated `Company.RevenueSize` field, frontend `stores/revenueSizeOptions.ts` / `components/Crm/RevenueSizeOptionModal.vue` / a Revenue Sizes card on `pages/admin/pipeline-config.vue`'s Company tab, and a Revenue Size dropdown on the Company create/edit forms |

> Note: the *account management* half of this section — creating/editing/listing Staff user accounts (`pages/admin/users/`) — is ✅ built, and *access-control enforcement* (FR-CRM-080) is real (`RequireRoles` route middleware, mirrored in the frontend). *Configurability* (FR-CRM-081) is now partial — pipeline stages and Lead sources are Admin-configurable, Tags/custom fields and Product Catalog config screens are not.

### 3.9a Workflow Automation

Generic, Admin-configurable notification rules that watch for a pipeline entity sitting idle or approaching a deadline, so a stalled Deal or an expiring Quote surfaces to the owner (and optionally their manager) proactively instead of only showing up when someone happens to open the relevant report.

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-100 | System shall support Admin-configurable "stage idle" rules: if a Deal remains in a given stage longer than N days (per-rule threshold), notify the Deal owner (and optionally their manager). | S | ✅ **2026-08-21** `NotificationRule{entity_type: 'deal'}` + `internal/notifier/workflow_rules.go`'s `checkDealIdleRule`, running on its own 15-minute ticker (`StartWorkflowRuleReminders`, alongside the existing Task due-date ticker). "Manager" resolves to every active Sales Manager (`recipient_role: 'owner_and_managers'`) — there's no per-rep manager hierarchy in this schema to notify one specific manager |
| FR-CRM-101 | System shall support Admin-configurable rules that notify on an approaching date threshold for a Quote (validity date) or Contract (unsigned past a target date), reusing the same detection logic as the existing Quotes Expiring Soon (FR-CRM-096) and Contracts Stuck (FR-CRM-097) reports as the notification source. | S | ✅ **2026-08-21** `checkQuoteExpiringRule`/`checkContractStuckRule` (same file), matching those two reports' definitions exactly |
| FR-CRM-102 | Notification rules shall be defined generically (entity type + condition + threshold + recipient) rather than as one-off hardcoded triggers per entity, so a new rule doesn't require new backend hook code. | C | 🚧 **2026-08-21** `NotificationRule{entity_type, threshold_days, recipient_role}` is Admin-configurable end-to-end (`/admin/notification-rules`, `pages/admin/pipeline-config.vue`'s "Notification Rules" card) with no new backend code needed to add another rule of an *existing* entity type. Genuinely one fixed condition per `entity_type` though (not a free-form condition expression) — adding a genuinely new condition (e.g. a different date field on Quote) would still need a new `check*Rule` function, so this is "generic within three supported shapes," not a full rule DSL |

### 3.9 Document Attachments

A generic attachment mechanism for the working documents Sales/Production actually pass around — quotations, proposals, estimations, plans, and other supporting material — as distinct from the two narrower, already-specified file fields that exist for a specific lifecycle purpose: the Quote PDF export (FR-CRM-042) and the Contract signed document (FR-CRM-044). Those two stay as-is; this section covers everything else, attachable to a Lead, Deal, Company, or Project.

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-085 | System shall allow uploading one or more file attachments to a Lead, Deal, Company, or Project, each tagged with a category: Quotation, Proposal, Estimation, Plan, Support Info, or Other. | M | ✅ Lead/Company/Deal detail pages; Project not wired to an Attachments tab yet |
| FR-CRM-086 | Accepted attachment types shall be PDF, image (PNG/JPG), and spreadsheet (XLSX/XLS/CSV), capped at 10 MB per file (same limit as §6.1's existing upload convention). | M | ✅ |
| FR-CRM-087 | System shall also accept an external link (e.g. a Google Sheets/Docs/Drive URL) in place of an uploaded file, since those formats are shared by link rather than downloaded/re-uploaded as a binary. | M | ✅ |
| FR-CRM-088 | The record's detail page shall list all attachments (file/link name, category, uploader, uploaded date) with download (for uploaded files) or open-link (for external links) actions. | M | ✅ via `components/Crm/AttachmentList.vue` |
| FR-CRM-089 | Only the Sales Rep/Sales Manager/Admin roles shall be able to upload or delete an attachment; any role that can already view the parent Lead/Deal/Company/Project may view and download its attachments. | M | ✅ enforced server-side (`internal/routes/routes.go`'s attachments route group) |
| FR-CRM-090 | When a Lead is converted into a Deal (FR-CRM-004), any attachments on that Lead shall be carried over to the resulting Deal rather than left behind on the now-converted Lead record. | M | ✅ handled inside the same transaction as `POST /leads/:id/convert` |

> Deleting an attachment (FR-CRM-089) removes only its metadata row — the underlying file in object storage is not scrubbed. Orphaned-file cleanup is out of scope for v1, consistent with how uploads are handled elsewhere in this spec (§6.1).

---

## 4. Data Model (Core Entities)

```
Company (1) ── (N) Contact
Company (1) ── (N) Deal
Company (1) ── (N) CustomerProduct ── (1) Product      [§3.7 — real products in use]
Company (1) ── (N) Project ── (0..1) Deal               [§3.7 — real projects, summary-level]
Deal    (1) ── (N) Quote ── (N) QuoteLineItem ── (1) Product
Deal    (1) ── (N) Contract
Deal    (1) ── (N) Payment                              [§3.3 — partial payments toward Deal value]
Deal    (1) ── (N) Activity (call/email/meeting note)
Deal    (1) ── (N) Task/Reminder
Deal    (1) ── (N) Attachment                           [§3.9 — polymorphic, also attaches to Lead/Company/Project]
Lead    (1) ── (N) Attachment                           [§3.9 — carried over to the Deal on conversion, FR-CRM-090]
Company (1) ── (N) Attachment                           [§3.9]
Project (1) ── (N) Attachment                           [§3.9]
Contact (1) ── (N) Activity
User (1) ── (N) Deal (owner)
User (1) ── (1) Role
Prospect (0..1) ── (1) Company                          [§3.1a — pre-Lead funnel entity, nullable FK like Lead.company_id]
Prospect (1) ── (0..1) Lead                             [§3.1a — set on Convert, FR-CRM-106]
Prospect (1) ── (N) Task/Attachment                     [§3.1a/§3.9 — carried over to the Lead on conversion]
```

Key entities and notable fields:

- **Lead**: id, name, email, phone, source, status, assigned_to (User), notes, created_at
- **Company**: id, name, industry, size, website, address, tags[], created_at
- **Contact**: id, company_id, name, job_title, email, phone, is_primary, tags[]
- **Deal**: id, company_id, contact_id, title, value, currency, stage, probability, expected_close_date, status (open/won/lost), lost_reason, owner_id, channel (Referral/Website/Event/Ads/Other), business_unit (Project/Product, nullable), business_unit_item (free-text label of the specific project/product, nullable) — the last three fields back the dashboard's Channel and Business Unit filters (FR-CRM-055) only; they are a lightweight tag on the Deal itself, **not** the real CustomerProduct/Project relationship modeled in §3.7
- **Activity**: id, type (call/email/meeting/note), related_to (Deal/Contact/Company), summary, participants[], occurred_at, created_by
- **Task**: id, related_type (deal/contact/company), related_id, title, description, due_date, assigned_to, status (pending/done), priority (low/medium/high, default medium), notified_at (nullable)
- **Quote**: id, deal_id, line_items[] (each referencing product_id), total, status, valid_until
- **Contract**: id, deal_id, status, signed_file_url, signed_date
- **Payment**: id, deal_id, amount, paid_at, method (cash/transfer/card/other), note — one row per installment; a Deal's collected revenue is the sum of its Payments, distinct from the Deal's total contract `value`
- **Product**: id, name, category, description, is_active
- **CustomerProduct**: id, company_id, product_id, status (Interested/Trial/Active/Churned), start_date, end_date, source_deal_id (nullable)
- **Project**: id, company_id, deal_id (nullable), name, status (Not Started/In Progress/On Hold/Completed/Cancelled), start_date, target_end_date, production_reference (text/url, nullable), notes
- **Attachment**: id, related_type (lead/deal/company/project/prospect), related_id, category (Quotation/Proposal/Estimation/Plan/Support/Other), file_name, file_url (nullable), external_url (nullable — exactly one of file_url/external_url is set), file_size (nullable), mime_type (nullable), uploaded_by, created_at
- **Prospect**: id, name, company_id (nullable, same shape as Lead.company_id), email, phone, source (validated against its own admin-configurable ProspectSourceOption list, separate from Lead/Deal's), status (New/Engaging/Nurturing/Disqualified/Converted — fixed enum, not admin-configurable), notes, assigned_to (User), tags[], converted_lead_id (nullable, set by Convert), created_at
- **User**: id, name, email, role, active

Note: `Product`, `CustomerProduct`, and `Project` are kept deliberately summary-level. No Task/Sprint/Roadmap/FeatureRequest tables exist in this schema — that detail lives entirely in Production's own system.

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | Role-based access control must be enforced at the API layer, not just UI hiding. |
| NFR-002 | System should support at least 30 concurrent internal (Sales) users at v1 scale. |
| NFR-003 | Page loads for list/board/dashboard views should complete within 2 seconds for up to ~10,000 Company/Contact/Deal records. |
| NFR-004 | All data in transit must use HTTPS/TLS. Passwords hashed (bcrypt/argon2), never stored in plaintext. |
| NFR-005 | System should provide daily automated backups of the database. |
| NFR-006 | UI must be responsive (usable on tablet/mobile browser), since Sales reps are often out of office. |
| NFR-007 | Audit log entries must be immutable (append-only). |

---

## 6. Integrations (Future / Stretch)

- Email (SMTP/IMAP or BCC-to-log) for auto-capturing communications (FR-CRM-033)
- Calendar (Google/Outlook) for meeting scheduling
- Slack / Line Notify for real-time notifications
- E-signature tool (e.g., DocuSign) for Contract signing (FR-CRM-043/044)
- **Production system webhook/API** (optional, later phase) to auto-update a Project's status/reference (FR-CRM-069) — kept optional and decoupled so this CRM never depends on Production's internal data model.

---

## 7. Out of Scope (v1)

- Full Project Management *execution* (Kanban, Sprints, Gantt, resourcing, time tracking) — owned by the Production team's own system/spec. This CRM only keeps a summary Project record per §3.7.
- Full Product Management *execution* (Roadmap, Backlog, Feature Requests, Releases) — owned by the Production team's own system/spec.
- Multi-tenant / multi-organization support
- Native mobile apps
- Full accounting/invoicing engine
- Advanced BI / custom report builder (basic dashboards only)

---

## 8. Build Notes for Claude Code

- Start with Company, Contact, and User/Role — every other entity hangs off these.
- Build the Deal pipeline (Kanban) and Quote/Contract flow next, since that's the core daily sales workflow.
- Implement Product Catalog, CustomerProduct, and Project (§3.7) as straightforward summary tables — resist the temptation to add workflow logic (statuses beyond the simple enums given, sub-tasks, etc.); that duplication is exactly what this spec is designed to avoid. The goal is that a Sales Rep opens a Company page and immediately sees every real Product and Project tied to that customer, alongside the sales history.
- Prompting for a Project (FR-CRM-068) on Deal-Won is a good early integration test of the whole flow: Lead → Deal → Won → real Project record appears on the Company page. **Do not** also auto-create a CustomerProduct on Deal-Won (FR-CRM-064) — see that row's 2026-08-22 note: it's an intentionally rejected feature, not a pending one. CustomerProduct is for the company's own packaged products/subscriptions (manual creation, FR-CRM-065), which is a different, largely non-overlapping population of deals from the custom-software-project deals that flow into Project via Quote/Contract.
- See `user-story.md` for role-based acceptance criteria to drive implementation and testing order.

---

## 9. Implementation Gap Summary (2026-08-17)

What actually exists today vs. what §3 specifies, at a glance:

**✅ Built:** Lead CRUD + status + Lead→Deal conversion, either as a manual action or automatically by dragging a Lead card past "Qualified" on the unified Deals Pipeline board where unconverted Leads and Deals now render side by side (§3.1, §3.3, FR-CRM-004/022); least-open-load auto-assignment of a new Lead among active Sales Reps when created with no explicit assignee (`pickAutoAssignee()`, `internal/handlers/leads.go`, FR-CRM-003) alongside manual assignment/reassignment; Company/Contact CRUD + tags (§3.2), now backed by real Pinia stores (`stores/companies.ts`/`stores/contacts.ts`) shared across every page instead of static per-page mock copies; Deal CRUD, Kanban pipeline, multiple deals per company, Deal probability (defaulted per-stage, manually overridable) and a required lost-reason code once a Deal resolves to Lost (FR-CRM-023/024, `internal/models/deal.go`), and per-Deal Payment tracking (record installments, live total-paid/remaining-balance) via `stores/payments.ts` and `components/Crm/AddPaymentModal.vue` (§3.3, FR-CRM-027/028); Admin-configurable pipeline stages and Lead sources (`PipelineStage`/`LeadSourceOption` models, `/admin/pipeline-stages` and `/admin/lead-sources` routes, `pages/admin/pipeline-config.vue`, FR-CRM-021/081) — Deal Won/Lost resolution now reads these configured stage flags instead of matching a hardcoded `"Won"`/`"Lost"` string, fixing a bug where a renamed/custom stage wouldn't be recognized; activity timeline display (§3.4); Tasks/Follow-ups (§3.4, FR-CRM-032) via `stores/tasks.ts` — per-Deal/Contact/Company Tasks tabs, a dedicated all-tasks page (`/crm/tasks`) with status/assignee filters and bulk mark-done/reassign, a confirm-before-marking-done dialog, an auto-created "Schedule kickoff call" follow-up task whenever a Deal is marked Won, and due-date email reminders via a new `internal/notifier` package + `internal/utils/mailer.go` (degrades safely with no SMTP configured); pipeline dashboard with win rate over a selectable date range, a probability-weighted revenue forecast (FR-CRM-052), average deal size/sales cycle, pipeline coverage vs. an Admin-configurable quota (`AppSettings` singleton, `GET`/`PATCH /admin/settings`, FR-CRM-058), optionally overridden per specific `(year, quarter)` period via a new `SalesTarget` CRUD resource so future quarters/years can be pre-set in advance (`GET`/`POST`/`PATCH`/`DELETE /admin/sales-targets`, FR-CRM-092), an Admin-configurable annual revenue goal tracked against actual Won revenue year-to-date (same `AppSettings` singleton, FR-CRM-091), a trailing revenue trend chart, win-rate-by-industry breakdown, an "Upcoming Follow-ups" task widget, and filtering by date range/Business Unit (Project or Product)/Channel (§3.6, FR-CRM-050/051/057/058/059/091/092, and part of FR-CRM-055); a global cross-entity search (Deals/Companies/Contacts/Leads) in the top nav; Staff/user account CRUD and login (§3.8 account management only); Quotes as a real per-Deal store (`stores/quotes.ts`, §3.5), with each line item now optionally linkable to a Product from the catalog (snapshotting its name/price at save time) alongside plain free-text items (FR-CRM-062); Product Catalog, Customer↔Product tracking, and Project tracking all built and linked from both the Company profile and the Deal-Won flow (§3.7 in full, FR-CRM-060/061/063/065/066/067/068/069/070 — see §3.7 for the couple of partials within it); real backend RBAC enforcement via `RequireRoles` route middleware, mirrored in the frontend (FR-CRM-080); Lead/Company/Deal file & external-link Attachments, including carrying them over on Lead→Deal conversion (§3.9, FR-CRM-085–090); a real frontend audit-log viewer (`pages/admin/activity-log.vue`, `stores/auditLog.ts`) consuming `GET /audit-log`, filterable by entity type/date range with a before/after diff view (FR-CRM-082); CSV export for Companies/Contacts/Deals/Products/Projects (Admin/Sales Manager gated, FR-CRM-083); and real server-side pagination/filtering/sorting (via new `fetchList()` store actions and `useServerListPage.ts`) on the Leads, Contacts, Companies list pages and the Deals List sub-view, replacing the old client-side slice of a 200-row fetch.

**🚧 Partial:** Bulk import of Companies/Contacts (FR-CRM-014) — works for CSV/XLS/XLSX, but built specifically against one FlowAccount export column layout; Company dedup now matches by normalized Website domain first, falling back to case-insensitive/trimmed name (Contact import still dedupes by email only); primary-contact flag on Contacts (unconfirmed); deal owner reassignment now has a history view (an Admin-only "Owner History" card on the Deal detail Overview tab, sourced from the existing audit log filtered to reassignment actions — not a dedicated table, but functionally covers the gap); manual activity-entry form (unconfirmed); per-rep leaderboard (won deals/revenue/win rate shown, activity count not); report filtering (each report page's own filters — date range/Sales Rep on `lead-source.vue`, Product/Status/Company Tag on `customer-product-status.vue` — are all correctly wired; no page combines all filter dimensions on one screen); Admin-side configurability (FR-CRM-081) now covers pipeline stages, Lead sources, and the sales quota (FR-CRM-058), but not Tags/custom fields or a Product Catalog config screen (Tags CRUD itself is fully built at `/crm/tags`, just linked from the Pipeline Config admin page rather than merged into it); Quote line items can now optionally reference a Product from the catalog, but it's an opt-in picker, not a mandatory product-only line item (FR-CRM-062); Quote status now includes a read-derived "Expired" state (a Sent quote past its validity date), display/filter-only — not directly settable via the status picker; the revenue forecast (FR-CRM-052) now has a forward-looking month-by-month breakdown ("Forecast Trend") alongside the existing single running total, though deals with no expected-close-date are excluded from the monthly buckets (still counted in the running total); the Deals Kanban board now fetches deals per-stage with pagination instead of one unbounded `fetchAll()`, matching the other list pages' server-pagination approach; Tasks' due-date notification is now built as email (needs real SMTP credentials configured to actually send) — push notification is still not built; Project→Deal linking (settable at creation via a Deal picker, but not viewable or editable anywhere afterward — no Project list/card surfaces its own `deal_id`).

**⬜ Not built at all:** Email/Slack integration beyond Task due-date email (§3.4, FR-CRM-033/034); Admin-side Tag/custom-field configurability (part of FR-CRM-081); Attachments on Project records (Lead/Company/Deal only so far). (Contracts, §3.5, and the lead-source report, FR-CRM-054, are already ✅ built — see §3.5/§3.6 above; this line previously misstated both as unbuilt.)

Practically: this is now a **Leads/Deals/Companies/Contacts CRM with a unified Kanban pipeline (Leads and Deals share one board), least-open-load Lead auto-assignment, per-Deal payment/probability/lost-reason tracking with a probability-weighted revenue forecast, Admin-configurable pipeline stages, Lead sources, and sales quota, follow-up Task management (per-record and team-wide) including due-date email reminders, a genuinely filterable sales dashboard, a working (if FlowAccount-specific) bulk-import path plus CSV export for Companies/Contacts/Deals/Products/Projects, real server-side pagination on the Leads/Contacts/Companies/Deals-List views, a full customer-portfolio layer (Product Catalog, Customer↔Product, and Project tracking, §3.7), real backend RBAC enforcement, a real frontend audit-log viewer, and file/link Attachments on Leads/Companies/Deals** — the customer-portfolio tracking that §3.7 once described as greenfield is now built end-to-end, and RBAC enforcement (FR-CRM-080) is real, not just a display field. What's left of §3.8's admin/governance requirements is specifically Tag/custom-field configurability and a Product Catalog config screen. Also note: Leads, Deals, Tags, Companies, Contacts, Payments, Tasks, Users, Quotes, Products, CustomerProducts, Projects, and Attachments are all now backed by real, shared Pinia stores (`stores/`) rather than page-local mock copies.
