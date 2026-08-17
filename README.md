# **I GEAR GEEK Sales CRM**

A CRM frontend for I GEAR GEEK's Sales team — leads, companies/contacts, a Kanban deal pipeline, quotes, payments, activity/task tracking, and a filterable sales dashboard.

Built with **Nuxt 4 + Nuxt UI 3 + Tailwind CSS v4**, running as a Single Page Application (SPA, `ssr: false`).

---

## **System Overview**

This app covers the sales lifecycle from an inbound Lead through a Won/Lost Deal, and beyond into ongoing customer/product/project tracking:

- **Leads** (`/crm/leads`) — capture, qualify, convert to a Deal (and Company/Contact if new), or disqualify.
- **Deals** (`/crm/deals`) — a unified Kanban pipeline (Lead → Qualified → Proposition → Negotiation → Won/Lost) where **unconverted Leads render as cards alongside Deals**: dragging a Lead card within Lead/Qualified/Lost just updates its status, while dragging it into Proposition/Negotiation/Won auto-converts it into a real Deal in place. Deals also carry per-Deal Quotes (PDF upload), Payments (installments toward the Deal's total value), Tasks/follow-ups, file/link Attachments, and an activity timeline. "Proposition" is the display label for the `Proposal Sent` stage value — the underlying `DealStage` type/API contract is unchanged.
- **Companies & Contacts** (`/crm/companies`, `/crm/contacts`) — the customer database, with tagging, per-record Tasks and Attachments, related Deals/Projects, and a FlowAccount-export bulk-import flow.
- **Projects & Products** (`/crm/projects`) — a company-scoped Project catalog (status, target date, an optional link back to the Deal it originated from) and a shared Product Catalog (full CRUD) used to track which Products each Company is using (Customer↔Product).
- **Tags** (`/crm/tags`) — shared segmentation labels (Tier/Industry/Priority) used across Companies and Contacts.
- **Tasks** (`/crm/tasks`) — every follow-up task across all Deals/Contacts/Companies in one filterable list, with bulk mark-done/reassign and a confirm-before-done dialog; a Deal marked "Won" auto-creates a kickoff-call follow-up task.
- **Sales Pipeline Dashboard** (`/`) — pipeline value/win rate/revenue trend/pipeline coverage, filterable by date range, Business Unit, and Channel; a per-rep leaderboard; an "Upcoming Follow-ups" task widget; and stale-account upsell prompts.
- **Global search** (top nav) — find a Deal, Company, Contact, or Lead by name from anywhere in the app.
- **Admin** (`/admin/users`, `/admin/activity-log`) — staff account CRUD; the activity feed is still a static mock, not a real audit log viewer yet.

**Current build status:** this app is API-backed by a real Go/Postgres backend — see the sibling [`sales-system-api`](../sales-system-api) repo. Role-based access control (Admin / Sales Rep / Sales Manager / Production) is enforced **server-side**; the frontend mirrors it (via `useRole`) only to hide actions the backend would reject, never as the actual security boundary. `biz_spec/api-system-spec.md` is the API contract both repos are kept in sync against — check it (and `biz_spec/feature-spec.md`'s §9 gap summary) before assuming a given endpoint/requirement is or isn't implemented, since a handful of items (Contracts, CSV export, Admin-side pipeline/tag configurability, a frontend audit-log viewer) are still unbuilt.

### Documentation (`biz_spec/`)

The business requirements, acceptance criteria, API contract, and UI conventions behind this codebase are documented separately and kept in sync with what's actually built (each carries a ✅/🚧/⬜ status per requirement):

| Doc | Purpose |
|---|---|
| `biz_spec/feature-spec.md` | Full functional/non-functional requirements (SRS), data model, and an implementation gap summary |
| `biz_spec/user-story.md` | Role-based user stories and use cases, traceable to `feature-spec.md` requirement IDs |
| `biz_spec/api-system-spec.md` | The backend API contract this frontend expects — for a separate backend repo to implement against |
| `biz_spec/design-system.md` | Design tokens, layout conventions, and component patterns actually implemented in this codebase |
| `biz_spec/ux-ui-guidelines/` | Per-pattern UI guidelines (filters, tables, modals, detail layouts, BOF layout) |

Read `feature-spec.md` and `design-system.md` before adding a new page or entity — they describe what already exists so new work stays consistent instead of re-deriving conventions from scratch.

---

## **บทบาทผู้ใช้และกรณีการใช้งาน (สรุปภาษาไทย)**

> สรุปภาพรวมเป็นภาษาไทยสำหรับผู้ที่ไม่คุ้นเคยกับศัพท์เทคนิค ก่อนเข้าสู่ส่วน Tech Stack และการติดตั้งด้านล่าง (รายละเอียดฉบับเต็มอยู่ที่ `biz_spec/feature-spec.md` และ `biz_spec/user-story.md`)

### บทบาทผู้ใช้ (User Roles)

| บทบาท | หน้าที่หลัก |
|---|---|
| **แอดมิน (Admin)** | จัดการบัญชีผู้ใช้งาน (`/admin/users`) และภาพรวมระบบ |
| **เซลล์ / ผู้ดูแลลูกค้า (Sales Rep / Account Manager)** | ดูแล Lead, Deal, บริษัท, ผู้ติดต่อของตนเอง บันทึกการชำระเงิน และสร้าง/ติดตามงาน (Tasks) ที่ต้องทำ |
| **หัวหน้าทีมขาย (Sales Manager)** | ดูภาพรวมทีมผ่าน Dashboard, มอบหมาย/โยกย้าย Deal, ติดตามงานเกินกำหนดของทั้งทีม |
| **ทีม Production (สิทธิ์จำกัด)** | อัปเดตสถานะและ Production Reference ของ Project ที่เชื่อมกับ Deal ของบริษัทลูกค้าเท่านั้น |

### กรณีการใช้งานจริง (Use Cases)

- **จาก Lead ถึง Deal ที่ปิดสำเร็จ:** เซลล์สร้าง Lead ใหม่ → การ์ด Lead ปรากฏบนบอร์ด Kanban เดียวกับ Deal ทันที → ลากผ่านขั้นตอนต่าง ๆ (ผ่าน "Qualified" จะแปลงเป็น Deal จริงโดยอัตโนมัติ) → บันทึกการชำระเงินแต่ละงวด → กดปิด Deal สำเร็จ ระบบจะสร้างงานติดตาม "นัดหมาย Kickoff Call" ให้อัตโนมัติทันที
- **บริหารงานติดตามของทั้งทีม:** เซลล์เปิดหน้า "งานติดตาม" (`/crm/tasks`) เพื่อดู กรอง และจัดการงานทั้งหมดของตนในที่เดียว รวมถึงเลือกหลายรายการเพื่อทำเสร็จหรือมอบหมายใหม่พร้อมกัน
- **ตรวจสอบภาพรวมยอดขาย:** หัวหน้าทีมเปิด Dashboard เพื่อดู Win Rate, มูลค่า Pipeline, และ Leaderboard ของทีม พร้อมค้นหา Deal/บริษัท/ผู้ติดต่อที่ต้องการจากช่องค้นหาส่วนกลาง

> หมายเหตุ: ระบบเชื่อมต่อกับ Backend จริง (Go + PostgreSQL, ดู repo `sales-system-api`) แล้ว ไม่ได้ใช้ข้อมูลจำลองอีกต่อไป — ดู `biz_spec/api-system-spec.md` สำหรับ API Contract

---

## **Tech Stack**

| **Technology**         | **Purpose**                              |
| ---------------------- | ---------------------------------------- |
| **Nuxt 4 (SPA Mode)**  | Framework for Single Page Applications   |
| **Nuxt UI 3**          | Vue Component Library (built on Reka UI) |
| **Tailwind CSS v4**    | Utility-first CSS framework              |
| **Pinia**              | Global state management                  |
| **Axios**              | HTTP client for API calls                |
| **Vee-Validate**       | Form validation                          |
| **i18n**               | Internationalization (EN/TH)             |

## **Project Structure**

```bash
sales-system/
├── biz_spec/                     # Business requirements, user stories, API contract, design system (see above)
│
├── assets/
│   └── styles/
│       ├── global.css            # Tailwind v4 config, CSS variables, design tokens
│       └── typography.css        # Font-face declarations, typography utilities
│
├── composables/
│   └── utils/                    # Composables (useAPI, useAuth, useNotify, useFormatter, useDealMetrics, ...)
│
├── components/
│   ├── Crm/                      # Domain components (PipelineBoard, ActivityTimeline, AddPaymentModal, ImportContactsModal, ...)
│   ├── Admin/                    # Admin-only components (UserForm)
│   ├── Button/                   # UButton wrapper (Primary)
│   ├── Input/                    # Form inputs (Text, Password, Select, DatePicker, etc.)
│   ├── Table/                    # Data table with pagination and card types
│   └── Container/                # Layout containers
│
├── constants/mockData/           # Despite the folder name, this is no longer seed data — stores are API-backed. Holds static option lists, per-stage colors, and small pure-JS helpers (e.g. DEAL_STAGE_OPTIONS, findDuplicateDeals) shared across pages.
├── interfaces/                   # TypeScript interfaces (crm.d.ts, auth.d.ts, admin.d.ts, api.d.ts, ...)
├── locales/                      # Language files (en, th)
├── stores/                       # Pinia stores, one per entity — all API-backed (leads, deals, companies, contacts, payments, tags, tasks, projects, products, customerProducts, quotes, contracts, attachments, users, ...)
├── pages/
│   ├── crm/
│   │   ├── leads/ deals/ companies/ contacts/ tags/ tasks/ projects/   # Kanban + list views, bulk actions on Deals/Leads (multi-select toolbar)
│   │   └── reports/               # Admin/Sales-Manager-only: lead-source conversion, customers-by-product-status
│   ├── admin/                    # Staff users, activity log, trash.vue (restore soft-deleted Deals/Leads/Companies/Contacts, one tab each)
│   ├── account/change-password.vue  # Change password (any logged-in user, via the sidebar icon)
│   ├── login.vue                 # Login
│   ├── change-password.vue       # Forced password reset for Admin-assigned accounts (must_change_password)
│   └── index.vue                 # Sales Pipeline Dashboard
├── layouts/                      # Nuxt layouts (default, blank)
├── plugins/                      # Nuxt plugins (axios, vee-validate, sentry)
├── app.vue                       # Root component (UApp wrapper)
├── app.config.ts                 # Nuxt UI theme configuration
└── nuxt.config.ts                # Main Nuxt configuration
```

---

## **Prerequisites**

- **Node.js** version >= v22.12.0
- **pnpm** (recommended) or **Yarn**

---

## **Getting Started**

This frontend needs the [`sales-system-api`](../sales-system-api) backend (and a Postgres database) running to actually log in or load any data — it is not a standalone mock-data app. Start the backend first (see that repo's README: `cp .env.example .env`, then `go run ./cmd/api`; the first run seeds an Admin account and prints its email/password to stdout), then come back here.

### **1. Clone the project**

```bash
git clone https://github.com/JinIGEARGEEK/sales-system.git
cd sales-system
```

### **2. Set up environment variables**

```bash
cp .env.example .env
```

Set `API_URL` to wherever the backend is running (`http://localhost:8080` for local dev).

### **3. Install dependencies**

```bash
pnpm install
# or
yarn
```

### **4. Run in development mode**

```bash
pnpm dev
# or
yarn dev
```

The app will be available at: **http://localhost:3000**

### **5. Build for production**

```bash
pnpm build
```

This will generate all static files in `.output/public/`.

### **6. Preview the production build**

```bash
pnpm preview
```

Opens the built site on localhost for testing before deployment.

---

## **Deployment (Bitbucket CI/CD)**

This project uses **Bitbucket Pipelines** for automated build and deployment to **AWS S3 (Static Hosting)** and **CloudFront (CDN)** using OpenID Connect (OIDC) authentication.

### **Deployment by Branch / Tag**

| **Branch / Tag** | **Environment** |
| ---------------- | --------------- |
| develop          | Development     |
| release/\*       | Staging         |
| prod-\* (tags)   | Production      |

---

## **Deployment Environment Variables**

Configure these in **Bitbucket > Repository Settings > Deployments > Environment Variables** for each environment (develop, stage, production).

> **Note:** `AWS_OIDC_ROLE_ARN` and `AWS_DEFAULT_REGION` are set as **global workspace variables** and do not need to be declared per environment.

| **Variable**               | **Description**                  | **Example Value**       |
| -------------------------- | -------------------------------- | ----------------------- |
| STATIC_SITE_URL            | S3 Bucket name for deployment    | igg-frontend-dev-bucket |
| CLOUDFRONT_DISTRIBUTION_ID | CloudFront Distribution ID       | E123456ABCDEF           |

---

## **AI Integration (Claude Code)**

This project includes a `CLAUDE.md` file at the project root for **Claude Code** AI assistant integration.

### **Before starting the project:**

1. **Review `CLAUDE.md`** — It contains project conventions, architecture decisions, and rules that Claude Code will follow when assisting with development.
2. **Customize for your project** — Update the `CLAUDE.md` file to match your team's specific conventions, API patterns, and coding standards.
3. **Keep it updated** — As the project evolves, update `CLAUDE.md` to reflect new patterns, components, or rules so the AI stays aligned with the codebase.

The `CLAUDE.md` file covers:
- Project structure and tech stack
- Component patterns and naming conventions
- Icon system (Material Symbols)
- State management and API call patterns
- Form validation conventions
- Instructions to always read `.spec` test files before modifying components

> **Tip:** The more accurate your `CLAUDE.md` is, the better Claude Code will understand and assist with your project.

---

## **References**

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Nuxt UI 3 Documentation](https://ui.nuxt.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Pinia](https://pinia.vuejs.org/)
- [Vee-Validate](https://vee-validate.logaretm.com/v4/)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html)
- [Bitbucket Pipelines OIDC Guide](https://support.atlassian.com/bitbucket-cloud/docs/deploy-to-aws-using-openid-connect/)
