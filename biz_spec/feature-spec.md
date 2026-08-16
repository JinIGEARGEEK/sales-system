# Feature Specification (SRS) — CRM for Sales Team

**Project codename:** IGearGeek Sales CRM
**Document type:** Software Requirements Specification (SRS)
**Prepared for:** Build with Claude Code
**Version:** 2.3 (adds Thai role/use-case summary; reflects Tasks/Follow-ups now built)
**Date:** 2026-08-14
**Companion doc:** `api-system-spec.md` translates the requirements below into the concrete backend API contract for a separate backend repo — cross-check both before implementing a new resource so the two never drift apart.

> **Implementation status (as of 2026-08-14):** Every requirement below now carries a **Status** column reflecting what actually exists in the codebase (`pages/`, `constants/mockData/`, `stores/`), not just what's specified. Legend: ✅ Built · 🚧 Partial (some but not all of the requirement) · ⬜ Not built. This reflects a still-early build — Lead/Deal/Company/Contact CRUD (Companies/Contacts now backed by real Pinia stores, not static mock copies), the Kanban pipeline, per-Deal payment tracking (§3.3), per-Deal/Contact/Company follow-up Tasks with a dedicated all-tasks view (§3.4), a now-filterable sales dashboard (win rate, revenue trend, pipeline coverage, per-rep leaderboard), and a working Company/Contact bulk-import flow from a specific FlowAccount export format exist; Quotes/Contracts/Product Catalog/Project tracking (§3.5, §3.7), RBAC enforcement, and audit logging do not exist yet. See §9 for the full gap summary.

---

## บทบาทผู้ใช้และกรณีการใช้งาน (สรุปภาษาไทย)

> ส่วนนี้สรุปบทบาทผู้ใช้และตัวอย่างการใช้งานจริงเป็นภาษาไทย เพื่อให้ทีมงานฝั่งไทยเข้าใจภาพรวมได้เร็วก่อนเข้าสู่รายละเอียดทางเทคนิคด้านล่าง (ดูรายละเอียดฉบับเต็มเป็นภาษาอังกฤษที่ §2.2 และ §9)

### บทบาทผู้ใช้ (User Roles)

| บทบาท | หน้าที่หลัก |
|---|---|
| **แอดมิน (Admin)** | จัดการบัญชีผู้ใช้งานทั้งหมด กำหนดสิทธิ์การเข้าถึง และ (ในอนาคต) ตั้งค่าระบบ เช่น ขั้นตอน Pipeline, Tag, Product Catalog |
| **เซลล์ / ผู้ดูแลลูกค้า (Sales Rep / Account Manager)** | ดูแล Lead, Deal, บริษัท และผู้ติดต่อของตนเอง บันทึกการชำระเงินแต่ละงวด สร้างและติดตามงาน (Tasks) ที่ผูกกับ Deal/ผู้ติดต่อ/บริษัท |
| **หัวหน้าทีมขาย (Sales Manager)** | ดูภาพรวม Pipeline และผลงานของทั้งทีมผ่าน Dashboard, มอบหมาย/โยกย้าย Deal ระหว่างเซลล์, ติดตามงานที่เกินกำหนดของทั้งทีม |
| **ทีม Production (สิทธิ์จำกัด)** | ยังไม่ได้เป็นผู้ใช้งานเต็มรูปแบบของระบบนี้ — มีหน้าที่เพียงอัปเดตสถานะของ Project ที่เชื่อมกับ Deal เมื่อฟีเจอร์นี้ถูกสร้างขึ้น (ดู §3.7 — ยังไม่ได้พัฒนา) |

### กรณีการใช้งานจริง (Use Cases) — อ้างอิงจากฟีเจอร์ที่สร้างเสร็จแล้ว

**กรณีที่ 1 — จาก Lead ถึง Deal ที่ปิดสำเร็จ พร้อมงานติดตามอัตโนมัติ**
1. เซลล์สร้าง Lead ใหม่จากช่องทางเว็บไซต์ พร้อมระบุแหล่งที่มา
2. เซลล์ตรวจสอบคุณสมบัติ (Qualify) แล้วแปลง Lead เป็น Deal พร้อมสร้างข้อมูลบริษัทและผู้ติดต่อใหม่โดยอัตโนมัติ
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

> หมายเหตุ: กรณีการใช้งานที่เกี่ยวกับ Quote/Contract และ Product/Project Tracking (ตาม §3.5, §3.7) ยังไม่สามารถใช้งานได้จริงในระบบปัจจุบัน เนื่องจากยังไม่ได้พัฒนา — ดูรายละเอียดที่ §9

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
| FR-CRM-001 | System shall allow creating a Lead with name, contact info, source (referral, web, event, ads, etc.), and notes. | M | ✅ |
| FR-CRM-002 | System shall support Lead status: New, Contacted, Qualified, Disqualified. | M | ✅ |
| FR-CRM-003 | System shall allow assigning a Lead to a Sales Rep, manually or via round-robin/rule (stretch). | M / C | 🚧 manual assign only, no round-robin |
| FR-CRM-004 | System shall support converting a Qualified Lead into a Deal (and Contact/Company if new). | M | ✅ |
| FR-CRM-005 | System shall capture Lead source analytics (count/conversion rate by source). | S | ⬜ |

### 3.2 Company & Contact Management

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-010 | System shall allow creating/editing/archiving Company records (name, industry, size, website, address, notes, tags). | M | ✅ |
| FR-CRM-011 | System shall allow creating/editing/archiving Contact records linked to a Company (name, job title, email, phone, tags). | M | ✅ |
| FR-CRM-012 | System shall support multiple Contacts per Company, with one marked as "Primary." | M | 🚧 multiple contacts per company work; explicit "Primary" flag not confirmed |
| FR-CRM-013 | System shall allow tagging/segmenting Companies and Contacts (e.g., by industry, tier, product interest). | S | ✅ |
| FR-CRM-014 | System shall support bulk import of Contacts/Companies via CSV, with duplicate detection by email/domain. | C | 🚧 built for a specific FlowAccount export format (CSV/XLS/XLSX, not CSV-only), via `CrmImportContactsModal`; duplicate detection is by company **name**, not email/domain |
| FR-CRM-015 | System shall show a unified profile page per Company: contacts, deals (open/won/lost), communication timeline, quotes, contracts, tasks, **Products in use, and Projects (past and current)** — see §3.7. | M | 🚧 contacts, deals, and activity feed shown; quotes/contracts/tasks/Products/Projects not shown |

### 3.3 Pipeline & Deal Management

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-020 | System shall support Deals/Opportunities with title, value, currency, expected close date, owner (Sales Rep), and linked Company/Contact. | M | ✅ |
| FR-CRM-021 | System shall support a customizable pipeline of stages (e.g., Lead → Qualified → Proposition → Negotiation → Won/Lost). | M | 🚧 fixed stage list (`DEAL_STAGE_OPTIONS` constant), not Admin-configurable — "Proposition" is the display label for the `Proposal Sent` stage value |
| FR-CRM-022 | System shall provide a Kanban board view of Deals per stage, with drag-and-drop to change stage. | M | ✅ |
| FR-CRM-023 | System shall record a reason code when a Deal is marked "Lost" (e.g., price, timing, competitor, no budget). | S | ⬜ |
| FR-CRM-024 | System shall support Deal probability (%) either manually set or defaulted by stage, feeding into forecast calculations. | S | ⬜ |
| FR-CRM-025 | System shall allow re-assigning a Deal's owner, with history of prior owners retained. | S | 🚧 owner/assignee is editable; no history retained |
| FR-CRM-026 | System shall support multiple open Deals per Company (e.g., upsell alongside an existing account). | M | ✅ |
| FR-CRM-027 | System shall allow recording one or more partial Payments against a Deal (amount, date paid, payment method, note), since a Deal's total value is often collected across multiple installments rather than a single payment. | M | ✅ |
| FR-CRM-028 | The Deal detail page shall show total amount paid to date and remaining balance (Deal value minus sum of Payments), computed live as Payments are added or removed. | M | ✅ |

### 3.4 Communication & Activity Tracking

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-030 | System shall log calls, emails, and meeting notes against a Contact/Company/Deal, shown as a chronological timeline. | M | ✅ |
| FR-CRM-031 | System shall support manually logging an activity (type, date, summary, participants). | M | 🚧 timeline display exists; a manual "add activity" entry form is not confirmed |
| FR-CRM-032 | System shall support Tasks/Reminders/Follow-ups assigned to a Sales user, with due date, linked to a Deal/Contact, and notification on due. | M | 🚧 Tasks fully built — linked to Deal/Contact/Company via `stores/tasks.ts`, with per-record Tasks tabs, a dedicated all-tasks view (`/crm/tasks`) with filtering/bulk mark-done/bulk reassign, a confirm-before-marking-done dialog, and an auto-created follow-up task when a Deal is marked Won; "notification on due" (email/push) is not built |
| FR-CRM-033 | System shall support email integration (BCC-to-log or IMAP sync) to auto-capture email threads against a Contact — stretch goal. | C | ⬜ |
| FR-CRM-034 | System shall allow @mentioning a teammate in an activity note, triggering a notification. | S | ⬜ |

### 3.5 Quotes & Contracts

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-040 | System shall support creating a Quote/Proposal with line items, unit price, quantity, discount, and total, attached to a Deal. | M | 🚧 Quotes exist only as a mock array embedded in the Deal detail page — no dedicated create/edit flow |
| FR-CRM-041 | System shall support Quote status: Draft, Sent, Accepted, Rejected, Expired, with a validity date. | M | 🚧 status/validity fields exist in mock data; no full lifecycle UI |
| FR-CRM-042 | System shall support exporting a Quote as a PDF using a company template. | S | ⬜ |
| FR-CRM-043 | System shall support a Contract record with status (Draft, Sent, Signed, Expired) attached to a Deal. | S | ⬜ |
| FR-CRM-044 | System shall support attaching signed documents (file upload) to a Contract. | M | ⬜ |
| FR-CRM-045 | System shall require a Contract be marked "Signed" before a Deal can be marked "Won" (configurable, not hard-enforced by default). | C | ⬜ |

### 3.6 Reporting & Dashboards

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-050 | System shall provide a pipeline dashboard: deal count and value per stage. | M | ✅ |
| FR-CRM-051 | System shall calculate and display win rate (won ÷ (won + lost)) over a selectable date range. | M | ✅ dashboard's Time Period presets (This Month/Quarter/Year, Last 6/12 Months) and free-form date-range picker both drive the win rate stat |
| FR-CRM-052 | System shall provide a revenue forecast (sum of open Deal value × probability) by month/quarter. | S | ⬜ (no probability field exists) |
| FR-CRM-053 | System shall provide per-rep leaderboard: deals won, revenue closed, activities logged. | S | 🚧 "Team Performance" leaderboard shows won deal count, revenue closed, and win rate per rep; activity-logged count not included |
| FR-CRM-054 | System shall provide a lead-source report showing conversion rate by source. | S | ⬜ |
| FR-CRM-055 | System shall allow filtering all reports by date range, Sales Rep, and Company tag/segment. | S | 🚧 dashboard filters by date range (preset or custom), Business Unit (Project/Product), and Channel; filtering by Sales Rep or Company tag is not implemented |
| FR-CRM-056 | System shall provide a report answering "which customers use Product X" and "which customers have a Project in status Y" (see §3.7). | S | ⬜ still not built — see note below. Do not confuse with the dashboard's Business Unit/Project/Product filter (FR-CRM-055), which filters Deals by a lightweight tag field on the Deal itself, not a real CustomerProduct/Project relationship |
| FR-CRM-057 | System shall display average deal size and average sales cycle length (days from Deal creation to expected/actual close) for won Deals. | S | ✅ |
| FR-CRM-058 | System shall display a pipeline coverage ratio (open pipeline value ÷ a configured sales quota/target) with an on-track/below-target indicator. | S | ✅ quota is a hardcoded constant (`QUARTERLY_SALES_TARGET`), not yet Admin-configurable |
| FR-CRM-059 | System shall provide a trailing revenue trend chart (won revenue by month) and a win-rate breakdown segmented by customer industry. | S | ✅ |

### 3.7 Customer Portfolio: Real Products & Projects Tracking

This is the core addition that makes the CRM follow the **real, ongoing relationship** with each customer, not just the sales pipeline up to Won/Lost. It stays intentionally lightweight (status + dates + reference), so it does not duplicate the Production team's own detailed execution system.

> **Status: ⬜ Not built.** No Product Catalog, CustomerProduct, or Project entity/page exists anywhere in the codebase. The Deal detail page's "Create Project" action is a disabled placeholder modal stating the module "will be enabled in a later phase" (ref FR-INT-001 in the mock copy) — this entire §3.7 is still greenfield.

**Product Catalog**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-060 | System shall maintain a Product Catalog (id, name, category, description, active flag) representing the products/services IGearGeek offers. | M | ⬜ |
| FR-CRM-061 | Any authenticated role shall be able to create/edit/deactivate Product Catalog entries. | M | ⬜ |
| FR-CRM-062 | Quote line items (§3.5) shall reference a Product from the catalog rather than free-text, where possible. | S | ⬜ |

**Customer ↔ Product tracking**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-063 | System shall track, per Company, which Products they are associated with via a Customer-Product record: Product, status (Interested, Trial, Active, Churned), start date, end date (nullable), and the source Deal (if any). | M | ⬜ |
| FR-CRM-064 | When a Deal is marked "Won," the system shall automatically create/update Customer-Product records for each Product on the Deal's Quote, setting status to "Active." | M | ⬜ |
| FR-CRM-065 | Sales/Admin shall be able to manually add, edit, or change the status of a Customer-Product record independent of any Deal (e.g., marking a product "Churned" after a renewal is lost). | M | ⬜ |
| FR-CRM-066 | The Company profile page shall list all Products currently and previously associated with that customer, with status and dates. | M | ⬜ |

**Customer ↔ Project tracking**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-067 | System shall track, per Company, one or more Project records: name, optional linked Deal, status (Not Started, In Progress, On Hold, Completed, Cancelled), start date, target end date, and an optional Production Reference (free-text ID and/or URL pointing into Production's own system). | M | ⬜ |
| FR-CRM-068 | System shall allow creating a Project record manually, or prompting to create one when a Deal is marked "Won." | M | ⬜ placeholder modal only, non-functional |
| FR-CRM-069 | The Project's status/reference fields shall be editable by Sales/Admin by default; automatic sync from Production's system via webhook/API is a later-phase stretch goal, not part of this spec. | S | ⬜ |
| FR-CRM-070 | The Company profile page shall list all Projects (past and current) for that customer, sorted by most recent, each showing status and the Production Reference link if present. | M | ⬜ |
| FR-CRM-071 | This system shall NOT model Tasks, Sprints, Milestones, Backlogs, or Feature Requests as first-class entities. A Project here is a summary record for Sales visibility, not a delivery management tool — detailed execution belongs entirely to Production's own system. | M | ✅ trivially true — no such entities exist |

### 3.8 Admin & System Settings

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-CRM-080 | System shall support role-based access control per §2.2 roles, configurable per user. | M | ⬜ `role` is a display field only; `middleware/auth.global.ts` checks login state, not role — no permission enforcement anywhere |
| FR-CRM-081 | System shall allow Admin to customize pipeline stages, Lead sources, tags, Product Catalog, and custom fields on Deal/Company/Contact. | S | ⬜ stages/sources are hardcoded constants in `constants/mockData/deals.ts` |
| FR-CRM-082 | System shall maintain an audit log of key record changes (who changed what, when), at minimum for Deal stage changes, Won/Lost status, and Project/Product status changes. | S | ⬜ a `/admin/activity-log` page exists showing a static mock activity feed (signups, orders, system/payment events), but it is unrelated UI chrome — it does not log real Deal/Won-Lost/Project-Product changes, so this requirement is still not built |
| FR-CRM-083 | System shall support data export (CSV) for Companies, Contacts, Deals, Products, and Projects. | C | ⬜ |
| FR-CRM-084 | System shall support email notification integration (SMTP) at minimum; Slack/Line webhook is a stretch goal. | S | ⬜ `useNotify` only drives in-app toasts, no outbound email/SMTP/webhook |

> Note: the *account management* half of this section — creating/editing/listing Staff user accounts (`pages/admin/users/`) — is ✅ built; it's specifically the *access-control enforcement* (FR-CRM-080) and *configurability* (FR-CRM-081) that are missing.

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
Contact (1) ── (N) Activity
User (1) ── (N) Deal (owner)
User (1) ── (1) Role
```

Key entities and notable fields:

- **Lead**: id, name, email, phone, source, status, assigned_to (User), notes, created_at
- **Company**: id, name, industry, size, website, address, tags[], created_at
- **Contact**: id, company_id, name, job_title, email, phone, is_primary, tags[]
- **Deal**: id, company_id, contact_id, title, value, currency, stage, probability, expected_close_date, status (open/won/lost), lost_reason, owner_id, channel (Referral/Website/Event/Ads/Other), business_unit (Project/Product, nullable), business_unit_item (free-text label of the specific project/product, nullable) — the last three fields back the dashboard's Channel and Business Unit filters (FR-CRM-055) only; they are a lightweight tag on the Deal itself, **not** the real CustomerProduct/Project relationship modeled in §3.7
- **Activity**: id, type (call/email/meeting/note), related_to (Deal/Contact/Company), summary, participants[], occurred_at, created_by
- **Task**: id, related_to (Deal/Contact), title, due_date, assigned_to, status (open/done), reminder_sent
- **Quote**: id, deal_id, line_items[] (each referencing product_id), total, status, valid_until
- **Contract**: id, deal_id, status, signed_file_url, signed_date
- **Payment**: id, deal_id, amount, paid_at, method (cash/transfer/card/other), note — one row per installment; a Deal's collected revenue is the sum of its Payments, distinct from the Deal's total contract `value`
- **Product**: id, name, category, description, is_active
- **CustomerProduct**: id, company_id, product_id, status (Interested/Trial/Active/Churned), start_date, end_date, source_deal_id (nullable)
- **Project**: id, company_id, deal_id (nullable), name, status (Not Started/In Progress/On Hold/Completed/Cancelled), start_date, target_end_date, production_reference (text/url, nullable), notes
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
- Auto-creating a CustomerProduct (FR-CRM-064) and prompting for a Project (FR-CRM-068) on Deal-Won are good early integration tests of the whole flow: Lead → Deal → Won → real Product/Project records appear on the Company page.
- See `user-story.md` for role-based acceptance criteria to drive implementation and testing order.

---

## 9. Implementation Gap Summary (2026-08-14)

What actually exists today vs. what §3 specifies, at a glance:

**✅ Built:** Lead CRUD + status + Lead→Deal conversion (§3.1); Company/Contact CRUD + tags (§3.2), now backed by real Pinia stores (`stores/companies.ts`/`stores/contacts.ts`) shared across every page instead of static per-page mock copies; Deal CRUD, Kanban pipeline, multiple deals per company, and per-Deal Payment tracking (record installments, live total-paid/remaining-balance) via `stores/payments.ts` and `components/Crm/AddPaymentModal.vue` (§3.3, FR-CRM-027/028); activity timeline display (§3.4); Tasks/Follow-ups (§3.4, FR-CRM-032) via `stores/tasks.ts` — per-Deal/Contact/Company Tasks tabs, a dedicated all-tasks page (`/crm/tasks`) with status/assignee filters and bulk mark-done/reassign, a confirm-before-marking-done dialog, and an auto-created "Schedule kickoff call" follow-up task whenever a Deal is marked Won; pipeline dashboard with win rate over a selectable date range, average deal size/sales cycle, pipeline coverage vs. quota, a trailing revenue trend chart, win-rate-by-industry breakdown, an "Upcoming Follow-ups" task widget, and filtering by date range/Business Unit (Project or Product)/Channel (§3.6, FR-CRM-050/051/057/058/059, and part of FR-CRM-055); a global cross-entity search (Deals/Companies/Contacts/Leads) in the top nav; Staff/user account CRUD and login (§3.8 account management only).

**🚧 Partial:** Bulk import of Companies/Contacts (FR-CRM-014) — works for CSV/XLS/XLSX, but built specifically against one FlowAccount export column layout, and dedupes by company name rather than email/domain; Lead assignment (manual only, no round-robin); primary-contact flag on Contacts (unconfirmed); pipeline stages (fixed list, not configurable); deal owner reassignment (no history); manual activity-entry form (unconfirmed); Quotes (PDF upload/delete works on the Deal detail page against a page-local mock array, not a shared store; no line-item create form); per-rep leaderboard (won deals/revenue/win rate shown, activity count not); report filtering (date range/Business Unit/Channel work, filtering by Sales Rep or Company tag does not); pipeline coverage quota is a hardcoded constant, not Admin-configurable; Tasks' "notification on due" (email/push delivery) is not built — everything else in FR-CRM-032 is.

**⬜ Not built at all:** Contracts; Product Catalog; CustomerProduct tracking; Project tracking (§3.7 in full — the Deal-detail "Create Project" action is a disabled placeholder); Task due-date email/push notifications; email/Slack integration; @mentions; deal lost-reason codes; deal probability/forecast (FR-CRM-052); lead-source report (FR-CRM-054); the Product/Project status report of FR-CRM-056; RBAC enforcement and Admin-side configurability (§3.8); audit log (FR-CRM-082 — the `/admin/activity-log` page is a static mock feed, not a real change log); CSV/data **export** (only import exists now).

Practically: this is currently a **Leads/Deals/Companies/Contacts CRM with a Kanban pipeline, per-Deal payment tracking, follow-up Task management (per-record and team-wide), a genuinely filterable sales dashboard, and a working (if FlowAccount-specific) bulk-import path for Companies/Contacts** — reporting (§3.6) and task/follow-up tracking (§3.4) are now the most complete sections outside core CRUD, but the customer-portfolio tracking that §3.7 describes as "the core addition" has not been started, and none of §3.5's Quote/Contract lifecycle or §3.8's admin/governance requirements are implemented beyond static UI text. Note: the dashboard's new "Business Unit" (Project/Product) and "Channel" filters live entirely on the `Deal` record as simple tag fields (§4) — they are a dashboard convenience, not the real CustomerProduct/Project data model that §3.7 still requires. Also note: Leads, Deals, Tags, Companies, Contacts, Payments, Tasks, and Users are all now backed by real, shared Pinia stores (`stores/`) rather than page-local mock copies — Quotes are the one remaining exception (still a page-local array on the Deal detail page, not a store).
