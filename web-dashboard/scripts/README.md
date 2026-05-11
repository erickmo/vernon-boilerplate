# Smoke tests — koperasi

Two layers to verify the koperasi dashboard against a real backend
before adding more features.

## 1. API smoke (`npm run smoke:api`)

Plain Node script. Hits every Frappe endpoint the frontend calls and
validates response shape against the `PaginatedResponse<T>` contract
plus key per-doctype fields.

**Setup** — set these env vars (or in `.env.local`):

```
VITE_API_BASE_URL=https://your-frappe-site
API_KEY=<frappe_api_key>
API_SECRET=<frappe_api_secret>
```

**Run**:

```bash
npm run smoke:api
```

**Exit codes**: `0` = all pass. `1` = at least one hard fail.
Soft-fail entries (`~`) are endpoints that may not exist yet
(e.g. approve/reject custom methods) — they don't break the run.

**What to do on failures**

- Hard fail on `/api/resource/...?limit=1` → backend doctype name
  mismatch or auth wrong. Fix doctype name in
  `src/services/koperasi/*.service.ts`.
- Hard fail on `get_summary` → backend method missing or returns
  wrong shape. Coordinate with backend dev or update
  `NasabahSummary` in `src/types/koperasi/anggota.types.ts`.
- Filter / sort query string ignored → backend may expect Frappe-native
  `filters=[["field","=","value"]]` instead of flat `status=Diajukan`.
  Update `createEntityService` or service layer.

## 2. Route smoke (`npm run smoke:routes`)

Playwright E2E. Logs in, navigates every koperasi route, asserts the
heading renders and no console errors fire. Also catches any remaining
"coming soon" stub leak.

**Setup**:

```
PLAYWRIGHT_BASE_URL=http://localhost:5173
E2E_USER=teller@example.com
E2E_PASS=<password>
```

Dev server must be running (`npm run dev`).

**Run**:

```bash
npm run smoke:routes
```

Without `E2E_USER` / `E2E_PASS` the suite skips itself instead of
failing — so it's safe to wire into CI.
