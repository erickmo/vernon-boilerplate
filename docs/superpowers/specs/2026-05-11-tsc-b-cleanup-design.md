# `tsc -b` Cleanup — web-dashboard

**Date:** 2026-05-11
**Scope:** `web-dashboard/` TypeScript build (`tsc -b`)
**Goal:** Exit `tsc -b` with code 0. 162 errors → 0 across 46 files.

## Context

Recent koperasi sprint shipped dashboard, Pusat Persetujuan, Teller Workstation, smoke tests, and a filter-contract fix. `vite build` and `tsc --noEmit` are green, but `tsc -b` reports 162 pre-existing errors. The errors block IDE confidence, mask new regressions, and risk the next strict-mode upgrade.

This spec covers cleanup only. Out of scope: fixing the 11 pre-existing vitest failures, adding new strictness, refactoring beyond what each error class requires.

## Error Inventory

Captured from `npx tsc -b` on commit at HEAD (2026-05-11):

| Error code | Count | Root cause |
|------------|-------|------------|
| TS2353 | 79 | `ColumnDef` uses `header`, pages still pass `label`. |
| TS2322 | 20 | Generic fallback to `unknown` (form values) + `RefObject<T \| null>` vs `RefObject<T>`. |
| TS2593 | 15 | Vitest globals (`describe`, `it`) not in tsconfig `types`. |
| TS2304 | 14 | Vitest globals (`expect`, `beforeAll`, `afterEach`, `afterAll`) not in tsconfig `types`. |
| TS2305 | 9 | Three orphan services (`company-group.service.ts`, `superuser-company-group.service.ts`, `tenant-owner.service.ts`) import types deleted from `entity.types.ts`. Not imported anywhere — safe to delete. |
| TS2345 | 5 | `GuruFormValues.status: string` vs `Guru.status: "Aktif"\|"Cuti"\|"Nonaktif"`. |
| TS1484 | 5 | `verbatimModuleSyntax`: `RefObject` etc. imported without `import type`. |
| TS2344 | 3 | `*FormValues` missing index signature for `useForm<T extends Record<string, unknown>>`. |
| Other | ~12 | Unused imports (TS6133/TS6196), `ProgressStep.status` unknown property, `SecondaryNav` `Record<AppContext, string>` missing `sekolah`/`koperasi`, misc. |
| **Total** | **162** | 7 buckets. |

## Buckets

Each bucket is independently revertable. Order is mechanical wins → biggest single bucket → nuanced refactors → cleanup.

### Bucket 1 — Vitest types (TS2593, TS2304: ~29 errors)

**Files affected:** `src/__ui_tests__/**/*`

**Fix:**
1. Create `tsconfig.test.json` extending `tsconfig.app.json`, with:
   ```json
   {
     "include": ["src/__ui_tests__/**/*"],
     "compilerOptions": {
       "types": ["vitest/globals", "@testing-library/jest-dom", "vite/client"]
     }
   }
   ```
2. Update `tsconfig.app.json` to `exclude: ["src/__ui_tests__/**/*"]`.
3. Add `{ "path": "./tsconfig.test.json" }` to root `tsconfig.json` references.
4. Confirm `vite.config.ts` `test.globals: true` (vitest config) — already enabled per setup.ts using bare `beforeAll`.

**Verify:** `npx tsc -b` drops by ~29.

### Bucket 2 — Type-only imports (TS1484: 5 errors)

**Files affected:** `src/hooks/useClickOutside.ts`, `src/hooks/useEventListener.ts`, `src/hooks/useIntersectionObserver.ts`.

**Fix:** Convert `import { RefObject }` to `import { type RefObject }` (or split into a separate `import type` line). Verify imported symbols at each call site.

**Verify:** `npx tsc -b` drops by 5.

### Bucket 3 — Delete orphan services (TS2305: 9 errors)

**Files affected:**
- `src/services/company-group.service.ts`
- `src/services/superuser-company-group.service.ts`
- `src/services/tenant-owner.service.ts`

Each imports types (`CompanyGroup`, `ApiCompanyGroup`, `mapApiCompanyGroup`, `TenantOwner`, `ApiTenantOwner`, `mapApiTenantOwner`) that no longer exist in `@/types/entity.types`. `grep -rln` confirms they are not imported anywhere else.

**Fix:** `git rm` all three files.

**Verify:** `npx tsc -b` drops by 9.

### Bucket 4 — `ColumnDef.label` → `header` (TS2353: 79 errors)

**Files affected:** Primarily `src/pages/sekolah/akademik/*ListPage.tsx`. Possibly other list pages.

**Fix:** Inside `columns` array literals only, rename property key `label:` to `header:`. Do NOT rename anywhere else (RowActionDef and similar widgets still use `label`).

**Approach:** Manual `Edit` per file, not global sed (avoid collateral renames in unrelated code).

**Verify:**
- `npx tsc -b` drops by 79.
- Spot-check 2 affected pages render correct column headers (open in dev or run `smoke:routes`).

### Bucket 5 — FormValues index signature (TS2344: 3 errors)

**Files affected:** `src/hooks/useForm.ts`.

**Fix:** Relax `useForm<T extends Record<string, unknown>>` to `useForm<T extends object>`. `useForm` indexes `T[K]` and reads `Object.keys(values)` — `object` is sufficient.

**Verify:** `npx tsc -b` drops by 3.

### Bucket 6 — Genericize `FieldProps.value` + status union (remaining TS2322, TS2345)

**Files affected:** `src/hooks/useForm.ts`, `src/pages/sekolah/guru/GuruFormPage.tsx`, and any form page hitting `unknown` at `<input value=...>`.

**Two sub-fixes:**

1. **`FieldProps.value` is hardcoded `unknown`** in `useForm.ts`. Genericize: type `register<K extends keyof T>(name: K): FieldProps<T[K]>`, where `FieldProps<V> = { value: V; onChange: ...; onBlur: ... }`. Consumers (`<input value={field.value} />`) get correctly typed values.
2. **Status union mismatch:** `GuruFormValues.status: string` vs domain `Guru.status: "Aktif" | "Cuti" | "Nonaktif"`. Tighten `GuruFormValues.status` to the union. Verify select options literal-match.

**Verify:** `npx tsc -b` drops the remaining TS2322 + TS2345.

### Bucket 7 — Miscellaneous (~12 errors)

Case-by-case:

- **TS6196** `ModuleAccessLevel` declared but unused in `src/hooks/useModuleAccess.ts` — delete.
- **TS2353** `ProgressStep.status` — check `ProgressStep` type; either add `status` field or remove from caller in `ExampleDetailPage.tsx`.
- **TS2739** `SecondaryNav` `Record<AppContext, string>` missing `sekolah`/`koperasi` — extend the map with default labels for those contexts.
- **TS2322** `RefObject<T | null>` vs `RefObject<T>` in `useIntersectionObserver.ts` line 47 — generic widen to `RefObject<T | null>` for caller compatibility.
- Remaining unused imports / parameters — delete.

**Verify:** `npx tsc -b` returns exit 0.

## Verification Gate

After each bucket:

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"  # must monotonically decrease
```

After Bucket 7:

```bash
cd web-dashboard
npx tsc -b                          # exit 0
npx vite build                      # success
npx vitest run --reporter=basic     # same 46 pass / 11 fail as before
```

The 11 vitest failures are pre-existing and out of scope.

## Commit Strategy

One commit per bucket. Conventional Commits:

1. `chore(tsc): split tsconfig.test.json for vitest globals`
2. `chore(tsc): use type-only imports for RefObject`
3. `chore(services): delete orphan company-group + tenant-owner services`
4. `refactor(akademik): rename ColumnDef.label to header`
5. `refactor(useForm): relax T constraint to object`
6. `fix(guru): tighten GuruFormValues.status to union`
7. `chore(tsc): clean up misc strict errors`

## Risks

- **Bucket 4 collateral:** Renaming `label:` inside the wrong object literal breaks `RowActionDef` or unrelated widgets. Mitigation: edit per file with surrounding `key:`/`render:` context.
- **Bucket 5 widening:** Loosening `useForm` generic may surface latent bugs in `useForm` internals. Mitigation: read `useForm.ts` before changing; if internal uses `T[K]` indexing, the relaxation is safe.
- **Bucket 1 reference graph:** Adding a new project reference may force `tsBuildInfoFile` updates. Mitigation: clear `node_modules/.tmp/` build info between runs while validating.

## Non-Goals

- Fix the 11 pre-existing vitest failures.
- Migrate `useForm` to react-hook-form / Formik.
- Add new strict-mode flags (`exactOptionalPropertyTypes`, etc.).
- Refactor `DataTable` or `ListPageTemplate` APIs.
- Touch backend / Frappe app.

## Success Criteria

- `npx tsc -b` exits 0.
- `npx vite build` still succeeds.
- `npx vitest run` shows the same pass/fail split as pre-cleanup (46/11).
- Smoke routes test (`smoke:routes`) still passes.
- 7 atomic commits on a feature branch.
