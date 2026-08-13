# **I GEAR GEEK Frontend Starter**

Standard frontend project structure for **I GEAR GEEK**.

Built with **Nuxt 4 + Nuxt UI 3 + Tailwind CSS v4** for Static Site Generation (SSG) web applications.

---

## **Project Overview**

Frontend starter template for the **I GEAR GEEK Platform**.

Includes reusable components for forms, tables, buttons, date/time pickers, notifications, and authentication scaffolding.

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
igeargeek-starter/
├── assets/
│   └── styles/
│       ├── global.css            # Tailwind v4 config, CSS variables, design tokens
│       └── typography.css        # Font-face declarations, typography utilities
│
├── composables/
│   ├── service/                  # API service composables
│   └── utils/                    # General-purpose composables (formatter, auth, notify)
│
├── components/
│   ├── Button/                   # UButton wrapper (Primary)
│   ├── Input/                    # Form inputs (Text, Password, Select, DatePicker, etc.)
│   ├── Table/                    # Data table with pagination and card types
│   └── Container/                # Layout containers
│
├── constants/                    # Constants (enums, static config)
├── interfaces/                   # TypeScript interfaces
├── locales/                      # Language files (en, th)
├── stores/                       # Pinia stores
├── pages/                        # Nuxt page routes
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
