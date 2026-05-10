# web-dashboard — Boilerplate

## Stack

- **React 18** + **TypeScript** (strict)
- **Vite 8** — build tool, path alias `@/*` → `src/*`
- **React Router 6** — routes defined in `src/app/routes.tsx`
- **Zustand 5** — client state (auth, ui, notifications)
- **TanStack React Query 5** — server state
- **CSS Modules** (camelCase) — no Tailwind
- **Vitest** + **React Testing Library** + **MSW** — unit/component tests
- **Playwright** — E2E tests

## Tenant Mode

Controlled by a single env var:

```env
VITE_MULTI_TENANT=false   # single-tenant (default)
VITE_MULTI_TENANT=true    # multi-tenant
```

### Single-tenant mode (`VITE_MULTI_TENANT=false`)

```
/            → RootRedirect → /dashboard
/login       → LoginPage
/dashboard   → AuthRoute + AppShell + DashboardPage
/settings    → (add yourself)
```

- Auth store: `user + token` only
- Navbar: flat nav items, no company switcher
- Add pages under `/` route in `routes.tsx` → `singleTenantRoutes`

### Multi-tenant mode (`VITE_MULTI_TENANT=true`)

```
/                    → RootRedirect (role-based)
/login               → LoginPage
/choose-company      → ChooseCompanyPage
/su/*                → SuperuserRoute   (role: superuser)
/g/*                 → GroupRoute       (role: tenant_owner)
/c/:companyCode/*    → CompanyRoute     (authenticated + selectedCompany)
```

Root redirect logic:
| Role | Redirect |
|---|---|
| `superuser` | `/su/dashboard` |
| `tenant_owner` | `/choose-company` |
| employee with company | `/c/:code/dashboard` |
| employee without company | `/choose-company` |

- Auth store: adds `selectedCompany`, `selectedGroup`, `availableGroups`
- Navbar: shows workspace switcher + context-specific nav items + context colors
- Add pages in the appropriate route block in `routes.tsx`

## Architecture

```
src/
├── config/        # app.config.ts — VITE_MULTI_TENANT, VITE_APP_NAME
├── app/           # App, Router, Providers, ProtectedRoute (all guards)
├── hooks/         # useForm, useDataSource, useCompanyPath, useHQPath, ...
├── layouts/       # AppShell (context prop), AppNavbar, PageHeader
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── ChooseCompany/    ← multi-tenant only
│   └── errors/
├── services/      # api.client, createEntityService, auth.service
├── stores/        # auth (+ multi-tenant fields), ui, notification
├── theme/         # variables.css, reset.css, typography.css, motion.css
├── types/         # api.types, auth.types (Company, CompanyGroup), navigation.types
├── utils/         # cn, format, export (CSV/JSON/PDF)
└── widgets/Toast/ # Toast system
```

## Customization Checklist

1. **Rename app** → `VITE_APP_NAME` in `.env.local`
2. **Set tenant mode** → `VITE_MULTI_TENANT=true|false`
3. **Add nav items** → `NAV_ITEMS_*` in `src/layouts/AppNavbar/AppNavbar.tsx`
4. **Add routes** → `singleTenantRoutes` or `multiTenantRoutes` in `src/app/routes.tsx`
5. **Add pages** → `src/pages/`
6. **Add entity services** → `createEntityService()` in `src/services/`
7. **Customize theme** → `src/theme/variables.css`

## Key Patterns

### API client

```ts
import { apiClient } from '@/services/api.client'

apiClient.get<User[]>('/api/users')
apiClient.post<User>('/api/users', data)
apiClient.put<User>('/api/users/1', data)
apiClient.delete('/api/users/1')
```

### Toast notifications

```ts
import { toast } from '@/widgets/Toast/Toast'

toast.success('Data berhasil disimpan')
toast.error('Terjadi kesalahan, coba lagi')
```

### Path helpers (multi-tenant)

```ts
const companyPath = useCompanyPath()
navigate(companyPath('users'))   // → /c/CORP-01/users

const hqPath = useHQPath()
navigate(hqPath('reports'))      // → /g/reports
```

### Add a new CRUD feature

```
src/
├── services/users.service.ts    ← createEntityService('/api/users')
├── types/user.types.ts          ← User interface
└── pages/Users/
    ├── UsersListPage.tsx        ← useDataSource hook
    ├── UserDetailPage.tsx
    └── UserFormPage.tsx         ← useForm hook
```

`useDataSource` and `createEntityService` serialise list params as structured tuples:

```ts
sort: [['name', 1], ['updatedAt', -1]]
filters: [['status', '=', 'active'], ['priority', '>=', 2]]
```

The shared `buildQS()` helper JSON-encodes those arrays under the `sort` and `filters` keys.
Use the tuple-array contract consistently in docs and code:

```text
?sort=[['field', 1], ['field2', -1]]
?filters=[['field1', 'operator1', 'value1'], ['field2', 'operator2', 'value2']]
```

Do not use legacy `sort=name` or `filter[field]=value` examples for new code.

React Query UI defaults:

```ts
queries: {
  staleTime: 0,
  refetchOnWindowFocus: true,
}
```

Override those only when a page has a clear caching reason.

## API Response Contract

- `apiClient.get<T>()` returns the decoded JSON body only. It does not unwrap a
  nested `data` field for you.
- `createEntityService().list()` expects list endpoints to return
  `{"items":[...],"total":number,"limit":number,"offset":number}`.
- If the backend wraps the list payload, pass `responseWrapper` so the service
  can unwrap it before mapping items.
- Special endpoints can use page-based responses like
  `{"data":[...],"total":number,"page":number,"pageSize":number,"totalPages":number}`.
- Frontend services must read the API docs first, then implement the response
  parser to match the documented shape.

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=Dashboard
VITE_MULTI_TENANT=false
VITE_MOCK_MODE=false
```
