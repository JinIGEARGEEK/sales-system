# **I GEAR GEEK Sales CRM**

A CRM frontend for I GEAR GEEK's Sales team — leads, companies/contacts, a Kanban deal pipeline, quotes, payments, activity/task tracking, and a filterable sales dashboard.

Built with **Nuxt 4 + Nuxt UI 3 + Tailwind CSS v4**, running as a Single Page Application (SPA, `ssr: false`).

---

## **System Overview**

This app covers the sales lifecycle from an inbound Lead through a Won/Lost Deal:

- **Leads** (`/crm/leads`) — capture, qualify, convert to a Deal (and Company/Contact if new).
- **Deals** (`/crm/deals`) — a Kanban pipeline (Lead → Qualified → Proposal Sent → Negotiation → Won/Lost) with drag-and-drop stage changes, plus per-Deal Quotes (PDF upload), Payments (installments toward the Deal's total value), Tasks/follow-ups, and an activity timeline.
- **Companies & Contacts** (`/crm/companies`, `/crm/contacts`) — the customer database, with tagging, per-record Tasks, and a FlowAccount-export bulk-import flow.
- **Tags** (`/crm/tags`) — shared segmentation labels (Tier/Industry/Priority) used across Companies and Contacts.
- **Tasks** (`/crm/tasks`) — every follow-up task across all Deals/Contacts/Companies in one filterable list, with bulk mark-done/reassign and a confirm-before-done dialog; a Deal marked "Won" auto-creates a kickoff-call follow-up task.
- **Sales Pipeline Dashboard** (`/`) — pipeline value/win rate/revenue trend/pipeline coverage, filterable by date range, Business Unit, and Channel; a per-rep leaderboard; an "Upcoming Follow-ups" task widget; and stale-account upsell prompts.
- **Global search** (top nav) — find a Deal, Company, Contact, or Lead by name from anywhere in the app.
- **Admin** (`/admin/users`, `/admin/activity-log`) — staff account CRUD and an activity feed.

**Current build status:** the entire app runs on **client-side mock data** (Pinia stores seeded from `constants/mockData/`) — there is no real backend yet. See `biz_spec/api-system-spec.md` for the API contract a separate backend repo needs to implement to replace the mock stores.

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
| **ทีม Production (สิทธิ์จำกัด)** | อัปเดตสถานะ Project ที่เชื่อมกับ Deal เท่านั้น (ฟีเจอร์นี้ยังไม่ได้พัฒนา — ดู `biz_spec/feature-spec.md` §3.7) |

### กรณีการใช้งานจริง (Use Cases)

- **จาก Lead ถึง Deal ที่ปิดสำเร็จ:** เซลล์สร้าง Lead → แปลงเป็น Deal → ลากผ่านบอร์ด Kanban → บันทึกการชำระเงินแต่ละงวด → กดปิด Deal สำเร็จ ระบบจะสร้างงานติดตาม "นัดหมาย Kickoff Call" ให้อัตโนมัติทันที
- **บริหารงานติดตามของทั้งทีม:** เซลล์เปิดหน้า "งานติดตาม" (`/crm/tasks`) เพื่อดู กรอง และจัดการงานทั้งหมดของตนในที่เดียว รวมถึงเลือกหลายรายการเพื่อทำเสร็จหรือมอบหมายใหม่พร้อมกัน
- **ตรวจสอบภาพรวมยอดขาย:** หัวหน้าทีมเปิด Dashboard เพื่อดู Win Rate, มูลค่า Pipeline, และ Leaderboard ของทีม พร้อมค้นหา Deal/บริษัท/ผู้ติดต่อที่ต้องการจากช่องค้นหาส่วนกลาง

> หมายเหตุ: ระบบยังทำงานด้วยข้อมูลจำลอง (mock data) ฝั่ง Client เท่านั้น ยังไม่มี Backend จริง — ดู `biz_spec/api-system-spec.md`

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
├── constants/mockData/           # Per-domain mock data (leads, deals, companies, contacts, payments, ...) seeding every store
├── interfaces/                   # TypeScript interfaces (crm.d.ts, auth.d.ts, admin.d.ts, api.d.ts, ...)
├── locales/                      # Language files (en, th)
├── stores/                       # Pinia stores — one per entity (leads, deals, companies, contacts, payments, tags, tasks, users, ...)
├── pages/
│   ├── crm/                      # Leads, Deals, Companies, Contacts, Tags, Tasks
│   ├── admin/                    # Staff users, activity log
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

### **1. Clone the project**

```bash
git clone git@bitbucket.org:i-gear-geek/nuxtjs-3.git
cd nuxtjs-3
```

### **2. Set up environment variables**

```bash
cp .env.example .env
```

Then edit the `.env` file to match your environment (e.g., API URL, keys, etc.).

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
