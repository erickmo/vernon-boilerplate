# `tsc -b` Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive `npx tsc -b` from 162 errors to 0 in `web-dashboard/` without breaking `vite build` or `vitest run`.

**Architecture:** Seven sequential buckets, ordered mechanical-wins → biggest single bucket → nuanced refactors → misc cleanup. Each bucket = one atomic commit. After every bucket: run `npx tsc -b 2>&1 | grep -c "error TS"` and confirm count decreased.

**Tech Stack:** TypeScript 5.x, Vite, Vitest 1.x, React 18, `tsconfig` project references.

**Spec:** `docs/superpowers/specs/2026-05-11-tsc-b-cleanup-design.md`.

**Working directory:** `web-dashboard/` (all commands assume this CWD unless stated).

**Branch:** Create `chore/tsc-b-cleanup` before Task 1.

---

## Task 0: Branch + baseline

**Files:** none.

- [ ] **Step 1: Create branch**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git checkout -b chore/tsc-b-cleanup
```

- [ ] **Step 2: Capture baseline error count**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: `162` (record this number — used as the regression guard).

- [ ] **Step 3: Confirm vite build green pre-cleanup**

```bash
npx vite build
```

Expected: build succeeds, exit 0.

---

## Task 1: Bucket 1 — Split tsconfig for vitest globals (~29 errors)

**Files:**
- Create: `web-dashboard/tsconfig.test.json`
- Modify: `web-dashboard/tsconfig.app.json` (add `exclude`)
- Modify: `web-dashboard/tsconfig.json` (add reference)

- [ ] **Step 1: Create `tsconfig.test.json`**

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.test.tsbuildinfo",
    "types": ["vitest/globals", "@testing-library/jest-dom", "vite/client"]
  },
  "include": [
    "src/__ui_tests__/**/*",
    "src/**/*.test.ts",
    "src/**/*.test.tsx"
  ]
}
```

- [ ] **Step 2: Modify `tsconfig.app.json` — add exclude**

Add (at the end of `compilerOptions`'s sibling level, inside the top-level object):

```json
"exclude": [
  "src/__ui_tests__/**/*",
  "src/**/*.test.ts",
  "src/**/*.test.tsx"
]
```

- [ ] **Step 3: Modify root `tsconfig.json` — add reference**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.test.json" }
  ]
}
```

- [ ] **Step 4: Clear build info + re-check**

```bash
rm -rf node_modules/.tmp
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: `133` (162 − 29). If higher than 133, vitest types aren't applied — verify `tsconfig.test.json` `types` field and `include` globs.

- [ ] **Step 5: Verify vitest still runs**

```bash
npx vitest run --reporter=basic 2>&1 | tail -5
```

Expected: same 46 pass / 11 fail split as baseline.

- [ ] **Step 6: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/tsconfig.json web-dashboard/tsconfig.app.json web-dashboard/tsconfig.test.json
git commit -m "chore(tsc): split tsconfig.test.json for vitest globals"
```

---

## Task 2: Bucket 2 — Type-only imports (5 errors)

**Files:**
- Modify: `web-dashboard/src/hooks/useClickOutside.ts`
- Modify: `web-dashboard/src/hooks/useEventListener.ts`
- Modify: `web-dashboard/src/hooks/useIntersectionObserver.ts`

- [ ] **Step 1: Inspect each file's first import line**

```bash
cd web-dashboard
head -3 src/hooks/useClickOutside.ts src/hooks/useEventListener.ts src/hooks/useIntersectionObserver.ts
```

- [ ] **Step 2: Convert `RefObject` import to type-only in each file**

For each file, change e.g.:

```ts
import { RefObject, useEffect } from 'react'
```

to:

```ts
import { type RefObject, useEffect } from 'react'
```

Use the `Edit` tool on each file. If `RefObject` is the only import, replace with:

```ts
import type { RefObject } from 'react'
```

- [ ] **Step 3: Re-check**

```bash
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: `128` (133 − 5).

- [ ] **Step 4: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/hooks/useClickOutside.ts web-dashboard/src/hooks/useEventListener.ts web-dashboard/src/hooks/useIntersectionObserver.ts
git commit -m "chore(tsc): use type-only imports for RefObject"
```

---

## Task 3: Bucket 3 — Delete orphan services (9 errors)

**Files:**
- Delete: `web-dashboard/src/services/company-group.service.ts`
- Delete: `web-dashboard/src/services/superuser-company-group.service.ts`
- Delete: `web-dashboard/src/services/tenant-owner.service.ts`

- [ ] **Step 1: Re-confirm no importers**

```bash
cd web-dashboard
grep -rln "company-group.service\|tenant-owner.service\|superuser-company-group" src/
```

Expected output: only the three service files themselves. If anything else appears, STOP and re-plan — they are still in use.

- [ ] **Step 2: Delete files**

```bash
git rm src/services/company-group.service.ts src/services/superuser-company-group.service.ts src/services/tenant-owner.service.ts
```

- [ ] **Step 3: Re-check**

```bash
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: `119` (128 − 9).

- [ ] **Step 4: Update anatomy.md (OpenWolf)**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
# anatomy.md lives at workspace level
# Manually edit /Users/erickmo/Desktop/Project/.wolf/anatomy.md if it references the deleted files (it currently does not — only run grep to confirm)
grep -n "company-group.service\|tenant-owner.service\|superuser-company-group" /Users/erickmo/Desktop/Project/.wolf/anatomy.md || echo "anatomy.md clean"
```

- [ ] **Step 5: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git commit -m "chore(services): delete orphan company-group + tenant-owner services"
```

---

## Task 4: Bucket 4 — `ColumnDef.label` → `header` (79 errors)

**Files affected (17 files):**
- `src/pages/Examples/ExampleDetailPage.tsx`
- `src/pages/sekolah/akademik/AbsensiGuruListPage.tsx`
- `src/pages/sekolah/akademik/AbsensiSiswaListPage.tsx`
- `src/pages/sekolah/akademik/JadwalListPage.tsx`
- `src/pages/sekolah/akademik/MataPelajaranListPage.tsx`
- `src/pages/sekolah/akademik/PenilaianListPage.tsx`
- `src/pages/sekolah/akademik/RaportListPage.tsx`
- `src/pages/sekolah/guru/GuruListPage.tsx`
- `src/pages/sekolah/pengaturan/SemesterListPage.tsx`
- `src/pages/sekolah/pengaturan/TahunAjaranListPage.tsx`
- `src/pages/sekolah/perpustakaan/AnggotaPerpustakaanListPage.tsx`
- `src/pages/sekolah/perpustakaan/BukuListPage.tsx`
- `src/pages/sekolah/perpustakaan/DendaListPage.tsx`
- `src/pages/sekolah/perpustakaan/PeminjamanListPage.tsx`
- `src/pages/sekolah/perpustakaan/PengembalianListPage.tsx`
- `src/pages/sekolah/perpustakaan/ReservasiListPage.tsx`
- `src/pages/sekolah/siswa/SiswaListPage.tsx`

Note: `ExampleDetailPage.tsx` TS2353 is `ProgressStep.status`, NOT a column label — keep it for Bucket 7.

- [ ] **Step 1: For each list page, rename `label:` → `header:` inside the `columns` array**

For each file in the list above (except `ExampleDetailPage.tsx`):

1. Open file with `Read`.
2. Locate the `columns` array literal (typically `const columns: ColumnDef<X>[] = [...]`).
3. Inside that array only, replace every `label:` with `header:` using `Edit` with `replace_all: false` on each occurrence, OR `replace_all: true` if the file contains no `RowActionDef`/menu items that use `label`. Verify with `grep -n "label:" <file>` after — only RowAction/MenuItem entries (if any) should remain.

**Important:** Do NOT touch `RowActionDef`, dropdown menus, form labels, or aria-label strings. Only `ColumnDef<T>` entries.

- [ ] **Step 2: Re-check**

```bash
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: `40` (119 − 79).

- [ ] **Step 3: Smoke-test list pages render headers**

If a dev server is convenient:

```bash
npx vite --port 5181 &
# In another terminal:
# Visit /sekolah/akademik/jadwal and confirm column headers show real text
```

Otherwise rely on `vite build` succeeding + the existing `smoke:routes` (Bucket 7 verification covers).

- [ ] **Step 4: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add -A web-dashboard/src/pages/sekolah/
git add web-dashboard/src/pages/Examples/ExampleDetailPage.tsx 2>/dev/null || true  # only if it was modified for label rename (it shouldn't be)
git status  # verify only the 16 list pages staged
git commit -m "refactor(akademik): rename ColumnDef.label to header"
```

---

## Task 5: Bucket 5 — Relax `useForm` constraint (3 errors)

**Files:**
- Modify: `web-dashboard/src/hooks/useForm.ts`

- [ ] **Step 1: Read `useForm.ts`**

```bash
cat src/hooks/useForm.ts
```

- [ ] **Step 2: Confirm `T` is used only for `T[K]` indexing and `keyof T`**

Read the body. If any internal code does `values as Record<string, unknown>` or spreads with `...`, the relaxation may need an adjustment. If `T` is only used as `keyof T`, `T[K]`, and `Partial<T>`, the relaxation is safe.

- [ ] **Step 3: Edit signature**

Change:

```ts
export function useForm<T extends Record<string, unknown>>({
```

to:

```ts
export function useForm<T extends object>({
```

Also update any internal helper signatures (`type FieldErrors<T>`, `ValidateFn<T>`, `UseFormConfig<T>`, `UseFormReturn<T>`) only if they currently constrain `T extends Record<string, unknown>` — `T extends object` everywhere.

- [ ] **Step 4: Re-check**

```bash
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: `37` (40 − 3). If TS2322 form-value `unknown` errors also dropped here, Bucket 6's first sub-fix may be unnecessary — re-evaluate before starting Task 6.

- [ ] **Step 5: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/hooks/useForm.ts
git commit -m "refactor(useForm): relax T constraint to object"
```

---

## Task 6: Bucket 6 — Genericize `FieldProps.value` + tighten status union

**Files:**
- Modify: `web-dashboard/src/hooks/useForm.ts`
- Modify: `web-dashboard/src/pages/sekolah/guru/GuruFormPage.tsx`
- Possibly modify: other `*FormPage.tsx` files surfaced by `tsc -b` after Bucket 5

- [ ] **Step 1: List remaining TS2322 + TS2345 sites**

```bash
npx tsc -b 2>&1 | grep -E "TS2322|TS2345" | awk -F'(' '{print $1}' | sort -u
```

Record the file list — call it **TS6_FILES**.

- [ ] **Step 2: Genericize `FieldProps.value` in `useForm.ts`**

Change:

```ts
interface FieldProps {
  value: unknown
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onBlur: () => void
}
```

to:

```ts
interface FieldProps<V> {
  value: V
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onBlur: () => void
}
```

Update `register` (or the equivalent helper that returns `FieldProps`) signature so it returns `FieldProps<T[K]>` when called with `name: K`. Example (adapt to actual code shape):

```ts
function register<K extends keyof T>(name: K): FieldProps<T[K]> {
  return {
    value: values[name],
    onChange: (e) => setValue(name, e.target.value as T[K]),
    onBlur: () => setTouched(name, true),
  }
}
```

If `useForm` uses a different API (e.g. `getFieldProps`), apply the same generic widening.

- [ ] **Step 3: Tighten `GuruFormValues.status` union**

Read `src/pages/sekolah/guru/GuruFormPage.tsx` and `src/types/sekolah.types.ts` (or wherever `GuruFormValues` is declared). Find:

```ts
interface GuruFormValues {
  // ...
  status: string
}
```

Change to:

```ts
interface GuruFormValues {
  // ...
  status: 'Aktif' | 'Cuti' | 'Nonaktif'
}
```

Verify the `<select>` element in the form lists exactly those three options.

- [ ] **Step 4: Re-check**

```bash
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected count: ≤12 (only Bucket 7 misc remaining). Exact number depends on how many TS2322 cascaded from `FieldProps.value: unknown`.

- [ ] **Step 5: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/hooks/useForm.ts web-dashboard/src/pages/sekolah/guru/GuruFormPage.tsx
# Add any other TS6_FILES that were modified
git status  # verify
git commit -m "fix(useForm): genericize FieldProps.value; tighten GuruFormValues.status union"
```

---

## Task 7: Bucket 7 — Miscellaneous cleanup (~12 errors)

**Files:** Determined by `npx tsc -b` output after Task 6.

- [ ] **Step 1: Dump remaining errors**

```bash
npx tsc -b 2>&1 | grep "error TS"
```

Record the list.

- [ ] **Step 2: Fix each, smallest-blast-radius first**

For each remaining error, pick the minimal fix:

- **TS6196 `ModuleAccessLevel` unused** in `src/hooks/useModuleAccess.ts` → delete the import.
- **TS2353 `ProgressStep.status` not a known property** in `src/pages/Examples/ExampleDetailPage.tsx` → either add `status?: 'pending' | 'active' | 'done'` to the `ProgressStep` type (check current definition) or drop `status:` from the offending object literal. Pick: extend the type — the field clearly has a UI meaning.
- **TS2739 `SecondaryNav` `Record<AppContext, string>` missing `sekolah`/`koperasi`** in `src/layouts/SecondaryNav/SecondaryNav.tsx:12` → add `sekolah: 'Sekolah'` and `koperasi: 'Koperasi'` entries to the labels map.
- **TS2322 `RefObject<T | null>` not assignable to `RefObject<T>`** in `src/hooks/useIntersectionObserver.ts:47` → change the consuming type to `RefObject<T | null>` or cast at the return site. Pick: widen the consuming type — matches React 19 default.
- **Remaining TS6133 unused locals / parameters** → delete or prefix with `_`.
- **Anything else** → read the error, apply the obvious minimal fix.

- [ ] **Step 3: Final verification gate**

```bash
npx tsc -b
echo "tsc exit: $?"
npx vite build
echo "vite exit: $?"
npx vitest run --reporter=basic 2>&1 | tail -5
```

Expected:
- `tsc exit: 0`
- `vite exit: 0`
- vitest: same `46 passed / 11 failed` split as baseline (no new failures).

- [ ] **Step 4: Run smoke route test**

```bash
npm run smoke:routes 2>&1 | tail -10
```

Expected: all 24 route tests pass (same as pre-cleanup baseline). If a route now errors that didn't before, a column rename in Task 4 likely broke something — revert that file and re-do the rename more carefully.

- [ ] **Step 5: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add -A web-dashboard/
git commit -m "chore(tsc): clean up misc strict errors

tsc -b now exits 0. vite build green. vitest split unchanged."
```

---

## Task 8: Final sweep + PR

**Files:** none.

- [ ] **Step 1: Confirm clean state**

```bash
cd web-dashboard
npx tsc -b
npx vite build
```

Both exit 0.

- [ ] **Step 2: Update `.wolf/cerebrum.md` Key Learnings**

Append to `/Users/erickmo/Desktop/Project/.wolf/cerebrum.md` under `## Key Learnings`:

```markdown
- **SekolahPro3 web-dashboard tsc baseline (2026-05-11):** `tsc -b` exits 0. tsconfig is split into `app` (production code) and `test` (vitest globals). `ColumnDef` uses `header` not `label`. `useForm` returns `FieldProps<T[K]>` (generic per-field value). Orphan services `company-group/superuser-company-group/tenant-owner` were deleted — were stale references to removed types.
```

- [ ] **Step 3: Push branch + open PR**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git push -u origin chore/tsc-b-cleanup
gh pr create --title "chore(tsc): drive tsc -b from 162 errors to 0" --body "$(cat <<'EOF'
## Summary
- Split tsconfig for vitest globals
- Deleted 3 orphan services referencing removed types
- Renamed `ColumnDef.label` → `header` across 16 list pages
- Genericized `useForm` `FieldProps.value` to `T[K]`
- Tightened `GuruFormValues.status` to literal union
- Misc strict-mode cleanup

## Test plan
- [ ] `npx tsc -b` exits 0
- [ ] `npx vite build` exits 0
- [ ] `npx vitest run` same 46 pass / 11 fail split as `main`
- [ ] `npm run smoke:routes` all 24 routes pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Verification matrix

| After task | tsc-b errors | vite build | vitest | smoke:routes |
|-----------|-------------|------------|--------|--------------|
| 0 baseline | 162 | green | 46/11 | 24/24 |
| 1 | 133 | green | 46/11 | — |
| 2 | 128 | green | — | — |
| 3 | 119 | green | — | — |
| 4 | 40 | green | — | — |
| 5 | 37 | green | — | — |
| 6 | ≤12 | green | — | — |
| 7 | 0 | green | 46/11 | 24/24 |

## Rollback

If any task breaks `vite build` or `vitest`, revert that single commit. Each bucket is independent — partial completion lands cleanly.

```bash
git revert HEAD          # undo last bucket
git reset --hard HEAD~1  # OR drop it entirely if not yet shared
```
