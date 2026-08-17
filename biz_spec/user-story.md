# User Stories & Use Cases — CRM for Sales Team

**Companion document to:** `feature-spec.md`, `api-system-spec.md` (backend API contract derived from these stories' requirements)
**Version:** 2.5 (adds Thai role/use-case summary; reflects Tasks/Follow-ups now built, plus Deal probability/lost-reason/forecast, Admin-configurable pipeline stages/lead sources, a real audit-log view, CSV export, Lead round-robin auto-assignment, and Task due-date email notifications; updates S-15/M-3/M-8 for Quote `Expired` status, the Forecast Trend chart, and the Deal Owner History card)
**Date:** 2026-08-17

Each story references the Feature Requirement ID(s) it satisfies from `feature-spec.md`, for traceability. Format: *As a [role], I want to [action], so that [benefit].*

> **Implementation status (as of 2026-08-14):** Each story now carries a **Status** column derived from `feature-spec.md` §9's gap summary. Legend: ✅ Built · 🚧 Partial · ⬜ Not built. Section 2.5 (Real Products & Projects Tracking) and all of §2.4's Quote/Contract stories are the biggest gaps — see `feature-spec.md` §9 for the full picture.

---

## บทบาทผู้ใช้และกรณีการใช้งาน (สรุปภาษาไทย)

> สรุปบทบาทผู้ใช้และตัวอย่างการใช้งานจริงเป็นภาษาไทยก่อนเข้าสู่รายการ User Story แบบละเอียดด้านล่าง (เป็นภาษาอังกฤษ)

### บทบาทผู้ใช้ (User Roles)

| บทบาท | หน้าที่หลัก |
|---|---|
| **แอดมิน (Admin)** | จัดการบัญชีผู้ใช้งาน กำหนดสิทธิ์การเข้าถึง และตั้งค่าระบบ (§1 ด้านล่าง) |
| **เซลล์ / ผู้ดูแลลูกค้า (Sales Rep / Account Manager)** | ดูแล Lead, Deal, ผู้ติดต่อ, บริษัท บันทึกการชำระเงิน และสร้าง/ติดตามงาน (Tasks) ของตนเอง (§2 ด้านล่าง) |
| **หัวหน้าทีมขาย (Sales Manager)** | ดู Dashboard ภาพรวมทีม, รายงานยอดขาย, มอบหมาย/โยกย้าย Deal (§3 ด้านล่าง) |
| **ทีม Production (สิทธิ์จำกัด)** | อัปเดตสถานะ Project ที่เชื่อมกับ Deal เท่านั้น เมื่อฟีเจอร์นี้ถูกสร้างขึ้น (§4 ด้านล่าง — ยังไม่ได้พัฒนา) |

### กรณีการใช้งานจริง (Use Cases) — จากฟีเจอร์ที่สร้างเสร็จแล้ว

**กรณีที่ 1 — เซลล์ปิด Deal สำเร็จ พร้อมงานติดตามที่เกิดขึ้นอัตโนมัติ**
เซลล์แปลง Lead เป็น Deal, ลากผ่านขั้นตอนต่าง ๆ บนบอร์ด Kanban, บันทึกการชำระเงินแต่ละงวด แล้วกดปิด Deal สำเร็จ ("Won") — ระบบสร้างงานติดตาม "นัดหมาย Kickoff Call" ให้อัตโนมัติ กำหนดส่งใน 3 วัน มอบหมายให้เจ้าของ Deal ทันที ไม่ต้องมาสร้างเองด้วยมือ. (สอดคล้องกับ S-2, S-3, S-13c, S-13d ด้านล่าง)

**กรณีที่ 2 — การบริหารงานติดตามของทั้งทีม**
เซลล์เปิดหน้า "งานติดตาม" (`/crm/tasks`) เพื่อดูงานทั้งหมดของตนในที่เดียว กรองตามสถานะ/ผู้รับผิดชอบ, เปิดโหมด "เลือกรายการ" เพื่อทำเครื่องหมายว่าเสร็จหรือมอบหมายใหม่หลายรายการพร้อมกัน ส่วนหัวหน้าทีมเห็นงานเกินกำหนดของทั้งทีมผ่านวิดเจ็ต "Upcoming Follow-ups" บน Dashboard โดยไม่ต้องเปิดเข้าไปทีละ Deal. (สอดคล้องกับ S-12 ด้านล่าง)

**กรณีที่ 3 — หัวหน้าทีมตรวจสอบผลงานทีมและโอกาส Upsell**
หัวหน้าทีมเปิด Dashboard กรองตามช่วงเวลา ดู Win Rate, มูลค่า Pipeline, และ Leaderboard รายบุคคล พร้อมรายชื่อบัญชีลูกค้าที่ไม่ได้ติดต่อมานานเพื่อตามหาโอกาส Upsell. (สอดคล้องกับ M-1, M-2, M-4, M-9, M-10 ด้านล่าง)

> หมายเหตุ: กรณีการใช้งานที่เกี่ยวกับ Quote/Contract และ Product/Project Tracking (§2.4, §2.5 ด้านล่าง) ยังใช้งานจริงไม่ได้ เนื่องจากยังไม่ได้พัฒนา

---

## 1. Role: Admin

| # | User Story | Refs | Status |
|---|---|---|---|
| A-1 | As an Admin, I want to create and deactivate user accounts and assign roles, so that access is controlled per team member. | FR-CRM-080 | 🚧 account CRUD (`pages/admin/users/`) works; role has no access-control effect |
| A-2 | As an Admin, I want to customize pipeline stages, lead sources, tags, and custom fields, so that the system matches our actual sales process. | FR-CRM-081 | 🚧 pipeline stages and Lead sources are now Admin-configurable (`pages/admin/pipeline-config.vue`, `/admin/pipeline-stages`, `/admin/lead-sources`); Tags and custom fields still are not |
| A-3 | As an Admin, I want to maintain the Product Catalog (add/edit/deactivate products), so that the list of what we sell stays accurate for Quotes and reporting. | FR-CRM-060, FR-CRM-061 | ⬜ |
| A-4 | As an Admin, I want to view an audit log of key changes (deal stage, won/lost, project/product status), so that I can investigate mistakes or disputes. | FR-CRM-082 | ✅ `/admin/activity-log` now consumes the real `GET /audit-log` endpoint via `stores/auditLog.ts`, filterable by entity type/date range, with a before/after diff view |
| A-5 | As an Admin, I want to export Companies, Contacts, Deals, Products, and Projects to CSV, so that I can analyze data outside the system or back it up. | FR-CRM-083 | ✅ `GET /{companies,contacts,deals,products,projects}/export` (Admin/Sales Manager only) + a frontend export button on each list page |
| A-6 | As an Admin, I want to configure email notification settings, so that the team receives timely alerts. | FR-CRM-084 | ⬜ |

---

## 2. Role: Sales Rep / Account Manager

### 2.1 Leads & Pipeline

| # | User Story | Refs | Status |
|---|---|---|---|
| S-1 | As a Sales rep, I want to log a new Lead with source and contact details, so that no inbound inquiry is lost, and so we can later see which sources actually convert. | FR-CRM-001, FR-CRM-002, FR-CRM-005 | 🚧 create/status built; source analytics not built |
| S-1b | As a Sales rep, I want new Leads to be auto-assigned to me or a teammate (round-robin or rule-based), so that inbound leads get picked up fast even when no one manually assigns them. | FR-CRM-003 | ✅ a new Lead created with no explicit assignee is auto-assigned via `pickAutoAssignee()` — a least-open-load strategy among active Sales Reps, not literal index-based round robin; manual assignment/reassignment still available |
| S-2 | As a Sales rep, I want to convert a Qualified Lead into a Deal (creating the Company/Contact if new) with title, value, currency, owner, and expected close date, so that I can start tracking it through the pipeline. | FR-CRM-004, FR-CRM-020 | ✅ |
| S-3 | As a Sales rep, I want to move a Deal across pipeline stages on a Kanban board, so that I can track progress visually. | FR-CRM-021, FR-CRM-022 | ✅ Kanban works; stages are now Admin-configurable via `/admin/pipeline-stages` (see A-2) rather than a fixed list |
| S-4 | As a Sales rep, I want to record a reason when I mark a Deal "Lost," so that we learn from it later. | FR-CRM-023 | ✅ `Deal.lost_reason` (price/timing/competitor/no_budget/other), required once a Deal resolves to Lost; conditional select on the Deal detail page |
| S-5 | As a Sales rep, I want to track multiple open Deals for the same Company, so that I can pursue upsells on an existing account without losing track of the original deal. | FR-CRM-026 | ✅ |

### 2.2 Contacts & Companies

| # | User Story | Refs | Status |
|---|---|---|---|
| S-6 | As a Sales rep, I want to create, edit, and archive Company and Contact records, so that my customer database stays accurate and current. | FR-CRM-010, FR-CRM-011 | ✅ |
| S-7 | As a Sales rep, I want to mark one Contact as "Primary" per Company, so that I always know who to reach first. | FR-CRM-012 | 🚧 unconfirmed |
| S-8 | As a Sales rep, I want to tag/segment Companies by industry or tier, so that I can target follow-ups and campaigns. | FR-CRM-013 | ✅ |
| S-9 | As a Sales rep, I want to bulk-import Contacts/Companies from a CSV, so that I don't have to re-enter our existing customer list by hand. | FR-CRM-014 | 🚧 built for a FlowAccount export (CSV/XLS/XLSX) via an Import button on Companies/Contacts, tagging each record Vendor/Customer; Company dedup now matches by normalized Website domain first, falling back to case-insensitive/trimmed name (Company has no email field); Contact import still dedupes by email only |
| S-10 | As a Sales rep, I want a single Company profile page showing contacts, deals, communications, quotes, contracts, tasks, **and every real Product/Project this customer has with us**, so that I have the full relationship history in one place. | FR-CRM-015 | 🚧 contacts/deals/activity shown; quotes/contracts/tasks/Products/Projects not yet |

### 2.3 Communication & Tasks

| # | User Story | Refs | Status |
|---|---|---|---|
| S-11 | As a Sales rep, I want to log calls/emails/meeting notes against a Contact or Deal, so that my team has full context on every interaction. | FR-CRM-030, FR-CRM-031 | 🚧 timeline display built; manual entry form unconfirmed |
| S-12 | As a Sales rep, I want to set follow-up reminders on a Deal (or a Contact/Company), so that I never miss a next step. | FR-CRM-032 | 🚧 Tasks tab on Deal/Contact/Company detail pages, a dedicated all-tasks page (`/crm/tasks`) with filters and bulk mark-done/reassign, confirm-before-done dialog, and an auto-created follow-up task on Deal Won (`stores/tasks.ts`); due-date notification is now built as email (a 15-min `internal/notifier` ticker) but needs real SMTP credentials configured to actually send; push notification not built |
| S-13 | As a Sales rep, I want to @mention a teammate in a note, so that they're notified and can jump in. | FR-CRM-034 | ⬜ |
| S-13b | As a Sales rep, I want emails I send/receive with a client to be auto-logged against their Contact (via BCC-to-log or inbox sync), so that I don't have to manually copy-paste every thread. | FR-CRM-033 | ⬜ |

### 2.4 Quotes, Contracts & Payments

| # | User Story | Refs | Status |
|---|---|---|---|
| S-13c | As a Sales rep, I want to record a payment received against a Deal (amount, date, method, note), so that I can track installments collected over the life of a project or product sale. | FR-CRM-027 | ✅ `components/Crm/AddPaymentModal.vue` / `stores/payments.ts` |
| S-13d | As a Sales rep, I want the Deal detail page to show total paid and remaining balance at a glance, so that I know how much of the contract value is still outstanding without doing the math myself. | FR-CRM-028 | ✅ |
| S-14 | As a Sales rep, I want to build a Quote from Products in our catalog, so that pricing stays consistent and line items are never free-text guesses. | FR-CRM-040, FR-CRM-062 | 🚧 a real per-Deal Quote (`stores/quotes.ts`); each line item can now optionally pick a Product from the catalog via `AddQuoteModal.vue`, snapshotting its name/price at save time — free-text items are still allowed too, so this isn't yet mandatory product-only pricing |
| S-15 | As a Sales rep, I want to send a Quote and track its status (Sent/Accepted/Rejected/Expired), so that I know exactly where a proposal stands. | FR-CRM-041 | ✅ real per-Deal Quote CRUD (`stores/quotes.ts`); `Expired` is a read-derived status (`Quote.EffectiveStatus()`) computed when a `Sent` quote's `validity_date` has passed, without mutating the stored value — served consistently on List/Get/Create/Update/Export-PDF |
| S-16 | As a Sales rep, I want to export a Quote as a branded PDF, so that I can send something professional to the client. | FR-CRM-042 | ⬜ |
| S-17 | As a Sales rep, I want to attach a signed Contract to a Deal, so that there's a single source of truth for what was agreed. | FR-CRM-043, FR-CRM-044 | ⬜ |
| S-17b | As a Sales rep, I want the system to (optionally, per Admin config) block marking a Deal "Won" until its Contract is "Signed," so that we never start delivery on a handshake deal. | FR-CRM-045 | ⬜ |

### 2.5 Real Products & Projects Tracking (the core new capability)

| # | User Story | Refs | Status |
|---|---|---|---|
| S-18 | As a Sales rep, when I mark a Deal "Won," I want the Products on its Quote to automatically appear as "Active" on the Company's product list, so that I don't have to manually re-enter what they bought. | FR-CRM-063, FR-CRM-064 | ⬜ |
| S-19 | As a Sales rep, I want to manually add or update a Company's Product status (e.g., mark a product "Churned" after a failed renewal), so that the record reflects reality even outside a Deal. | FR-CRM-065 | ⬜ |
| S-20 | As a Sales rep, when I win a Deal, I want to be prompted to create a Project record (name, dates), so that we start tracking the real engagement right away. | FR-CRM-068 | ⬜ disabled placeholder modal only ("module ships in a later phase") |
| S-21 | As a Sales rep, I want to update a Project's status (Not Started/In Progress/On Hold/Completed/Cancelled) and paste in a link/ID to Production's own tracker, so that I can quickly check delivery status without pinging the Production team. | FR-CRM-067, FR-CRM-069 | ⬜ |
| S-22 | As a Sales rep, I want to see every Project (past and current) and every Product a Company has ever had with us, sorted by most recent, right on their Company page, so that I know their full history before a renewal or upsell call. | FR-CRM-066, FR-CRM-070 | ⬜ |

---

## 3. Role: Sales Manager

| # | User Story | Refs | Status |
|---|---|---|---|
| M-1 | As a Sales Manager, I want a pipeline dashboard showing deal count/value per stage, so that I can report on team performance. | FR-CRM-050 | ✅ |
| M-2 | As a Sales Manager, I want to see the team's win rate over a date range, so that I can track sales effectiveness. | FR-CRM-051 | ✅ Time Period presets (This Month/Quarter/Year, Last 6/12 Months) plus a free-form date-range picker both drive win rate |
| M-3 | As a Sales Manager, I want a revenue forecast based on open deal value × probability, so that I can plan for the quarter. | FR-CRM-052, FR-CRM-024 | ✅ `Deal.probability` (defaulted per-stage, manually overridable) feeds `/dashboard/summary`'s `forecasted_revenue` stat card **and** a new "Forecast Trend" chart (`forecast_trend`, a forward 6-month bucketing by `expected_close_date`, mirroring the Revenue Trend chart's shape) on `pages/index.vue`; Deals with no `expected_close_date` are excluded from the monthly buckets but still counted in the headline total |
| M-4 | As a Sales Manager, I want a per-rep leaderboard (deals won, revenue, activity count), so that I can coach the team fairly. | FR-CRM-053 | 🚧 "Team Performance" widget shows deals won, revenue closed, and win rate per rep; activity count not included |
| M-5 | As a Sales Manager, I want a lead-source report showing conversion rate by source, so that I know where to invest marketing spend. | FR-CRM-054 | ⬜ |
| M-6 | As a Sales Manager, I want to filter any report by date range, rep, or company tag, so that I can slice data the way I need. | FR-CRM-055 | 🚧 dashboard filters by date range, Business Unit (Project/Product), and Channel; filtering by Sales Rep or Company tag is not implemented |
| M-7 | As a Sales Manager, I want a report of "which customers use Product X" and "which customers have a Project in status Y," so that I can spot cross-sell opportunities or accounts that need attention. | FR-CRM-056 | ⬜ still not built — the dashboard's Business Unit/Project/Product filter (see M-9) is a lightweight Deal tag, not a real per-customer Product/Project report; do not conflate the two |
| M-8 | As a Sales Manager, I want to reassign a Deal to a different rep and see the prior owner history, so that I can rebalance workload without losing accountability. | FR-CRM-025 | ✅ reassignment works; an Admin-only "Owner History" card on the Deal detail page (`pages/crm/deals/[id]/index.vue`) shows prior owners, sourced from `GET /audit-log` filtered to `reassigned`/`bulk_reassigned` actions for that Deal — gated Admin-only since the underlying audit-log endpoint is Admin-only |
| M-9 | As a Sales Manager, I want to slice the dashboard by Business Unit (Project or Product, with a drill-down to the specific one) and by sales Channel, so that I can see performance by segment without a full custom report builder. | FR-CRM-055 | ✅ |
| M-10 | As a Sales Manager, I want to see average deal size, average sales cycle length, pipeline coverage against quota, a revenue trend chart, and a win-rate breakdown by customer industry, so that I can judge pipeline health beyond raw totals. | FR-CRM-057, FR-CRM-058, FR-CRM-059 | ✅ quota is now Admin-configurable (`AppSettings` singleton, `GET`/`PATCH /admin/settings`), edited from a "Sales Quota" card on `pages/admin/pipeline-config.vue` |

---

## 4. Cross-Team Touchpoint: Production Team (Limited)

The Production team is not a full user of this CRM. Their only interaction is keeping a Project's status/reference current, so Sales has visibility without needing full access to Production's own system.

| # | User Story | Refs | Status |
|---|---|---|---|
| PT-1 | As someone on the Production team, I want to update the status and reference link on a customer's Project record (manually today, possibly via a simple integration later), so that Sales can see accurate delivery status without me repeating it in every account call. | FR-CRM-069 | ⬜ |

---

**Scope guardrail (not a story, but an acceptance check — FR-CRM-071):** A Sales Rep or Admin should never need to open a Kanban board, sprint, or backlog inside this CRM to answer "what's the status of Acme's project?" — that answer must come entirely from the summary Project record in §2.5. If implementation ever adds sub-tasks, checklists, or sprint concepts to the Project entity, that's scope creep back into Production's territory and should be rejected.

## 5. Use Cases

> **Status:** all three use cases below are only partially walkable in the current build. Steps 1–3 of UC-1 (Lead → Deal → activity log) work end-to-end today; every step from "builds a Quote using catalog Products" onward (§UC-1 steps 4–9, and all of UC-2/UC-3) depends on Product Catalog, Contract, CustomerProduct, and Project entities that are ⬜ not built yet (see §9 of `feature-spec.md`).

### UC-1 — Lead to Won Deal to real Product/Project records (end-to-end)
1. Sales rep creates a Lead from a web inquiry (source = "Website").
2. Rep qualifies the Lead, converting it into a Deal in the "Qualified" stage, creating the Company "Acme Co." and its primary Contact.
3. Rep logs a discovery call and attaches notes to the Deal.
4. Rep builds a Quote using two Products from the catalog: "Custom Software Build" and "Annual Support Plan." Sends it; client asks for a discount; rep revises and resends.
5. Client signs; rep attaches the signed Contract and marks the Deal "Won."
6. System automatically creates two Customer-Product records on Acme's Company page: "Custom Software Build — Active" and "Annual Support Plan — Active."
7. System prompts: "Create a Project for this Deal?" Rep confirms, naming it "Acme Website Revamp," with a start date.
8. Weeks later, the Production team tells the rep (verbally, for now) that delivery has started. Rep opens the Project record and updates status to "In Progress," pasting in a link to Production's own tracker for reference.
9. Six months later, a Sales Manager reviewing Acme's account opens the Company page and immediately sees: 2 active Products, 1 in-progress Project with a link to Production's tracker, and the full deal/communication history — enough to plan a renewal conversation without a single internal Slack message.

### UC-2 — Manually tracking a churn and a lapsed product
1. Acme's Annual Support Plan comes up for renewal; the client declines.
2. Sales rep opens Acme's Company page, finds the "Annual Support Plan" Customer-Product record, and changes its status from "Active" to "Churned," with an end date.
3. The change is captured in the audit log.
4. A Sales Manager running the "customers by product status" report sees Acme drop out of the "Active — Annual Support Plan" segment, prompting a win-back task to be created.

### UC-3 — Spotting an upsell opportunity from the Product/Project view
1. Sales Manager runs the report "which customers use Product X" for "Custom Software Build" and cross-references it against Companies with no "Annual Support Plan" Customer-Product record.
2. The report surfaces 5 companies that bought custom builds but never added support.
3. Sales Manager assigns a follow-up Task to the account owner of each, referencing the specific Company page where the gap is visible.

---

## 6. Traceability Summary

Every Feature Requirement in `feature-spec.md` should map to at least one story above. If a future FR is added without a corresponding story, add one before implementation to confirm the requirement is actually usable by a real role — this is the acceptance-criteria check for that requirement.
