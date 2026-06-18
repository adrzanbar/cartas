# FONBEC Cartas

Payload CMS 3.80 + Next.js 16 — Letter management system for a scholarship foundation.

## Commands

```bash
pnpm dev                    # dev server (--no-server-fast-refresh)
pnpm devsafe                # rm -rf .next && pnpm dev
pnpm build                  # NODE_OPTIONS="--max-old-space-size=2048"
pnpm start                  # production serve (standalone output)
pnpm lint                   # ESLint flat config
tsc --noEmit                # typecheck
pnpm generate:types         # after schema changes -> payload-types.ts
pnpm generate:importmap     # after adding/editing components -> importMap.js
pnpm test:int               # Vitest integration tests
pnpm test:e2e               # Playwright e2e (requires dev server)
pnpm test                   # test:int && test:e2e
```

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PAYLOAD_SECRET` | CMS signing secret |
| `EMAIL_USER` / `EMAIL_CLIENT_ID` / `EMAIL_CLIENT_SECRET` / `EMAIL_CLIENT_REFRESH_TOKEN` | Gmail OAuth2 |
| `NEXT_PUBLIC_SERVER_URL` | Public server URL |

`.env.example` references MongoDB — **outdated**. The project uses PostgreSQL.

Start the DB: `docker compose up` (Postgres 18 on port 5432).

## Architecture

Single package, pnpm, `legacy-peer-deps=true` in `.npmrc`.

### Collections (9)

All under `src/collections/`. No `globals/`, no separate `access/` or `hooks/` dirs — access control and hooks live in collection files.

| Collection | Slug | Notes |
|---|---|---|
| Users | `users` | Auth, 5 roles (see RBAC below), `saveToJWT: true` |
| Media | `media` | Uploaded images, sharp processing |
| ScholarshipHolders | `scholarship-holders` | Links to Users, has sponsor relations and optional mediator |
| Sponsors | `sponsors` | Name, organization, email (letter recipients) |
| Campaigns | `campaigns` | Has `sendAt`, links EmailTemplate, subject, message |
| EmailTemplates | `email-templates` | Handlebars template string + image array for inline CIDs |
| Letters | `letters` | Core entity: campaign + author + recipients + images + approval |
| LetterImages | `letter-images` | Images/PDFs uploaded per letter, stored on disk under `letter-images/` |
| Deliveries | `deliveries` | Delivery record auto-created on successful email send |

### RBAC (5 roles, in `Users.ts`)

`isAdmin`, `isReviewer`, `isTertiaryReviewer`, `isMediator`, `isScholarshipHolder` — all exported from `src/collections/Users.ts`.

- **admin**: full CRUD everywhere
- **tertiaryReviewer**: read all letters (tertiary level included)
- **reviewer**: read non-tertiary letters, can approve letters
- **mediator**: read/create for assigned scholarship holders
- **scholarshipHolder**: read/create own letters (author auto-assigned by `defaultValue` hook)

### Email

Custom Gmail OAuth2 REST adapter (`src/adapters/email-http-oauth.ts`). Uses `nodemailer` `MailComposer` for RFC2822 message building, sends via Gmail API HTTP endpoint (not SMTP). Requires OAuth2 refresh token.

### Job Queue

Cron `* 6-21 * * *` (hourly 6am–9pm), queue `default`, limit 2 concurrent. Jobs collection hidden from non-admins (group: "System"). Task: `send-letter` (`src/tasks/send-letter.ts`).

## Key Workflow

1. Admin creates **Campaign** with `sendAt` date + **EmailTemplate** (Handlebars)
2. Scholarship holder (or mediator) creates **Letter** with recipients (sponsors) and images
3. Admin/reviewer approves the letter (sets `approved = true`)
4. `afterChange` hook on Letters (`enqueueTask`) queues one `send-letter` job per recipient with `waitUntil: campaign.sendAt`
5. Job renders Handlebars template (variables: `becario`, `padrino`, `message`, `letterImages`, plus template inline image URLs), attaches images as CID or PDF, sends via Gmail API
6. On success, creates **Delivery** record; when all recipients have deliveries, Letter `sent` flag is set

Critical: approval is one-way — `update` access on Letters blocks changes after approval (`doc && !doc.approved`). The `beforeChange` hook `ensureUniqueCampaignAuthorRecipient` enforces one-letter-per-sponsor-per-campaign.

## Custom Components

Components are defined via **file paths** (not direct imports) in `payload.config.ts`. Paths relative to `importMap.baseDir` (= `src/`).

### Path Syntax

```
'/components/Logout#MyComponent'   # named export (hash syntax)
'/components/Logout'               # default export
{ path: '/components/Logout', exportName: 'MyComponent' }   # object syntax
```

### Component Types

| Type | Scope | Config Location |
|---|---|---|
| **Root** | Global admin panel (logo, nav, header, dashboard) | `admin.components.*` in `payload.config.ts` |
| **Collection** | Per-collection list/edit views | `collection.admin.components.*` |
| **Global** | Per-global edit views | `global.admin.components.*` |
| **Field** | Per-field UI/cell | `field.admin.components.*` |
| **UI Field** | Presentational (no data) | `{ type: 'ui', admin: { components: { Field: ... } } }` |

### Root Component Slots

| Path | Description |
|---|---|
| `graphics.Icon` | Small nav icon |
| `graphics.Logo` | Full logo (login page) |
| `Nav` | Entire sidebar nav |
| `header` | Array of components above header |
| `actions` | Array in header (buttons, etc.) |
| `beforeDashboard` / `afterDashboard` | Dashboard injection points |
| `beforeLogin` / `afterLogin` | Login page injection |
| `beforeNavLinks` / `afterNavLinks` | Nav link injection |
| `logout.Button` | Logout button |
| `settingsMenu` | Gear menu items (use `PopupList.ButtonGroup` / `PopupList.Button` from `@payloadcms/ui`) |
| `providers` | Custom React Context providers (must be `'use client'`) |

### Collection/Global Edit View Slots

| Path | Description |
|---|---|
| `edit.SaveButton` | Save button |
| `edit.SaveDraftButton` | Save draft (requires drafts) |
| `edit.PublishButton` | Publish (requires drafts) |
| `edit.UnpublishButton` | Unpublish (requires drafts) |
| `edit.PreviewButton` | Preview (requires `admin.preview`) |
| `edit.beforeDocumentControls` | Array before save/publish buttons |
| `edit.editMenuItems` | Array in 3-dot menu |
| `edit.Description` | Collection/global description |
| `edit.Status` | Draft/published status indicator |
| `edit.Upload` | File upload component |

For Globals, use `elements.*` instead of `edit.*`.

### List View Slots (Collections only)

| Path | Description |
|---|---|
| `views.list.Component` | Replace entire list view |
| `beforeList` / `afterList` | Before/after the list |
| `beforeListTable` / `afterListTable` | Before/after the table |
| `listMenuItems` | Array in list controls menu |
| `Description` | Collection description |

### Custom Views

Views can either **replace** built-in views or **add new** ones via `admin.components.views`:

```typescript
// Root-level view (in payload.config.ts)
admin: {
  components: {
    views: {
      dashboard: { Component: '/components/Dashboard' },         // replace
      myCustomPage: { Component: '/components/MyPage', path: '/my-page' },  // add new
    },
  },
}

// Collection-level view
admin: {
  components: {
    views: {
      list: { Component: '/components/CustomList' },
      edit: {
        default: { Component: '/components/CustomEdit' },
        myTab: { Component: '/components/CustomTab', path: '/custom-tab', tab: { label: 'Tab' } },
      },
    },
  },
}
```

View options: `Component` (required), `path` (required for new views), `exact`, `strict`, `sensitive`, `meta`.

**Security:** Custom views are public by default — check `initPageResult.req.user` yourself.

**Templates:** Use `DefaultTemplate` from `@payloadcms/next/templates` for consistent layout.

### Server vs Client Components

- **Default**: Server Components (can use Local API directly via `payload` prop)
- **Client**: Add `'use client'` — Payload auto-strips non-serializable default props

Default props: `payload`, `i18n`, `locale`, `params`, `searchParams`, `initPageResult`

### Available Client Hooks (from `@payloadcms/ui`)

`useAuth`, `useConfig`, `useDocumentInfo`, `useField`, `useForm`, `useFormFields`, `useLocale`, `useTranslation`, `usePayload`

### Import Map

Auto-generated at `src/app/(payload)/admin/importMap.js`. Regenerated on startup, HMR, or `pnpm generate:importmap`. Never edit manually.

### Dashboard Widgets

Experimental. Define in `admin.dashboard.widgets`:
```typescript
admin: {
  dashboard: {
    widgets: [
      {
        slug: 'my-widget',
        Component: '/components/MyWidget',
        fields: [{ name: 'title', type: 'text' }],
        minWidth: 'small',
        maxWidth: 'medium',
      },
    ],
    defaultLayout: ({ req }) => [{ widgetSlug: 'collections', width: 'full' }],
  },
}
```

Widget components receive `WidgetServerProps` with `req` and optional `widgetData`.

### Field Components

| Property | Description |
|---|---|
| `Field` | Edit view field UI |
| `Cell` | List view cell |
| `Label` | Field label |
| `Description` | Field description |
| `Error` | Error message |

TypeScript: use `TextFieldServerComponent`, `TextFieldClientComponent`, `SelectFieldServerComponent`, etc. from `payload`.

When using `useFormFields`, scope to specific fields to avoid re-renders:
```tsx
const value = useFormFields(([fields, dispatch]) => fields[path])  // ✅
// NOT: const { fields } = useForm()                               // ❌
```

### Styling

Use Payload CSS vars (`var(--theme-elevation-500)`, `var(--theme-text)`, etc.) or import SCSS:
```scss
@import '~@payloadcms/ui/scss';
.my-component { @include mid-break { ... } }
```

### Performance

- Admin panel: import from `@payloadcms/ui` directly
- Frontend: import from `@payloadcms/ui/elements/Button` (tree-shakeable paths)
- Prefer Server Components; minimize serialized props to client
- Use `useFormFields` over `useForm` to avoid full re-renders

## Tooling Quirks

- **DB**: PostgreSQL via `@payloadcms/db-postgres`. `.env.example` references MongoDB — ignore it.
- **Package manager**: pnpm. Also has `.yarnrc` (legacy) — use pnpm.
- **All scripts** use `cross-env NODE_OPTIONS=--no-deprecation` to suppress Node warnings.
- **`next.config.mjs`**: `output: 'standalone'`, `serverExternalPackages: ['handlebars']` (Handlebars uses `fs` at runtime on the server).
- **Tailwind CSS v4** with `@tailwindcss/postcss`, shadcn/ui "radix-nova" style.
- **Admin panel**: Spanish-only (`supportedLanguages: { es }`, `fallbackLanguage: 'es'`), teal primary color (`#139885`).
- **Letter images** stored on disk under `letter-images/` (not in DB directly).
- **No CI/GitHub Actions** configured.

## Virtual Fields

Any field type can be made virtual (`virtual: true` or `virtual: 'path'`) — value is computed at read time, not stored in DB.

### Boolean mode (`virtual: true`)

Use `afterRead` hooks to compute the value:

```typescript
{
  name: 'fullName',
  type: 'text',
  virtual: true,
  hooks: {
    afterRead: [({ siblingData }) => `${siblingData.firstName} ${siblingData.lastName}`],
  },
}
```

### String path mode (`virtual: 'relatedField.path'`)

Resolves relationship data automatically via dot notation:

```typescript
{
  name: 'authorName',
  type: 'text',
  virtual: 'author.name',      // resolves to name of the related user
}
{ name: 'categoryTitles', type: 'text', virtual: 'categories.title' }  // hasMany → array
```

**Requirements:**
- The source relationship field (e.g. `author`) must exist in the same collection
- `hasMany` relationships return arrays
- Appears in API responses like any other field
- No DB column is created

## Critical Payload Gotchas

1. **`overrideAccess: false`** — When passing `user` to Local API, ALWAYS set this. Without it, the operation runs with admin privileges regardless of the user.
2. **`req` in hooks** — Always pass `req` to nested `payload.*` calls inside hooks, or they run in a separate transaction (data corruption risk).
3. **Hook loops** — Use `context` flags to prevent infinite loops when a hook triggers the same hook again.
4. **Field-level access** returns boolean only (no query constraints).
5. **After schema changes**: run `pnpm generate:types`. After component changes: run `pnpm generate:importmap`.

## Validation Order

Always: `pnpm generate:types` (if schema changed) → `tsc --noEmit` → `pnpm lint` → `pnpm test:int`
