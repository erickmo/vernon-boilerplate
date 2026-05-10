# Vernon Tasks UI — Design Spec

**Date:** 2026-05-10  
**Status:** Approved (auto-decided, no user review required)  
**Stack:** React 18 + TypeScript + CSS Modules + Zustand + React Query + Recharts  
**Backend:** Frappe v15 at `VITE_FRAPPE_URL` (session cookie + CSRF token auth)

---

## Decisions (from UX specialist + COO + PM consultation)

| Decision | Choice |
|---|---|
| Auth model | Frappe session cookie + CSRF token (replaces JWT) |
| Default landing | `/my-work` for all roles after login |
| My Work layout | 3 sections: Focus (hero), Today, Blocked |
| PDCA labels in UI | Human-readable: "Sedang Dikerjakan", "Menunggu Review", "Selesai" |
| Primary action per task | Single context-aware button only |
| Leader Review layout | Split panel (no modal for main flow) |
| Reject flow | Modal with required reason text |
| Nav items | Role-filtered: Member sees My Work + My Dashboard; Leader also sees team section |
| Frappe client | New `frappe-client.ts` (separate from existing `api.client.ts`) |

---

## Auth Adaptation

- `csrfToken` stored in auth store (replaces `token/refreshToken`)
- Login: POST `/api/method/login` → session cookie auto-set by browser → GET CSRF token → GET user (with roles)
- All mutating requests: `X-Frappe-CSRF-Token` header + `credentials: 'include'`
- Session expiry: 403/401 → clear store → redirect `/login`
- User roles mapped: Frappe roles `["VT Member", "VT Leader", "VT Manager"]` → stored in `user.permissions[]`

---

## Routes (single-tenant)

```
/login          → LoginPage (guest only)
/my-work        → MyWorkPage (VT Member+)
/my-dashboard   → MyDashboardPage (VT Member+)
/leader-dashboard → LeaderDashboardPage (VT Leader+)
/leader-review  → LeaderReviewPage (VT Leader+)
```

Default redirect after login: `/my-work`

---

## Services Layer

```
src/lib/frappe-client.ts         ← HTTP client for Frappe (CSRF, cookie, error mapping)
src/services/auth.service.ts     ← UPDATE: Frappe login/logout/me
src/services/tasks.service.ts    ← NEW: My Work API calls
src/services/my-dashboard.service.ts ← NEW: My Dashboard API calls
src/services/leader.service.ts   ← NEW: Leader Dashboard + Review API calls
src/services/QK.ts               ← UPDATE: add VT query keys
```

---

## Page: My Work

**Audience:** VT Member  
**Route:** `/my-work`

**Layout (top to bottom):**
1. **PageHeader** — "Selamat Bekerja, [Name]" + date
2. **Focus Card** (hero) — single highest-priority task. Large card, colored left border by phase. Context-aware action button.
3. **Today's Tasks** — section list of all tasks due today, task cards with phase badge + action button
4. **Blocked Tasks** — collapsible section, visually subdued, shows blocker name

**Task card fields:** title, project, priority badge, phase badge (human-readable), due date, estimated hours, single action button  
**Action mapping:**
- BACKLOG/PLAN → "Mulai Tugas" → `start_task`
- DO → "Kirim Review" → `submit_for_review`
- CHECK → disabled label "Menunggu Review"
- DONE → hidden/no action

**Empty states:** each section has calm empty state text.  
**Loading:** Skeleton cards while fetching.

---

## Page: My Dashboard

**Audience:** VT Member  
**Route:** `/my-dashboard`

**Layout:**
1. **Stats row (4 cards):** done today, done this week, points this month, blocked count
2. **Completion chart** — 7-day bar chart (Recharts BarChart), rendered via `ChartCard` widget
3. **Hours summary** — actual vs estimated, progress-bar style

---

## Page: Leader Dashboard

**Audience:** VT Leader, VT Manager  
**Route:** `/leader-dashboard`

**Layout:**
1. **Stats row (3 cards):** pending reviews (big badge, urgent), overdue count (red), team points this month
2. **Phase distribution** — donut/pie chart of all 6 PDCA phases
3. **Team leaderboard** — top 10 ranked list with points
4. **Overdue tasks** — table: task, member, deadline, days overdue (sorted desc)

---

## Page: Leader Review

**Audience:** VT Leader, VT Manager  
**Route:** `/leader-review`

**Layout (desktop: split panel):**
- **Left (40%):** review queue list — task name, assignee, project, time in CHECK
- **Right (60%):** selected task detail — description, assignee info, hours, approve/reject actions

**Approve:** single click → immediate → success toast → remove from queue  
**Reject:** click → modal opens → required reason textarea (min 10 chars) → "Tolak & Beritahu" CTA → close modal → remove from queue  

**Secondary sections below split panel:**
- Team workload (member rows: name + hours used / capacity)
- Team blocked tasks (table)

**Empty state:** "Semua tugas sudah direview. Tidak ada antrian."

---

## Query Keys (add to QK.ts)

```typescript
vtMyWork: 'vt-my-work'
vtWhatToDoToday: 'vt-what-to-do-today'
vtMyBlockedTasks: 'vt-my-blocked-tasks'
vtEmployeeStats: 'vt-employee-stats'
vtDailyCompletions: 'vt-daily-completions'
vtHoursSummary: 'vt-hours-summary'
vtLeaderStats: 'vt-leader-stats'
vtPhaseDistribution: 'vt-phase-distribution'
vtTeamLeaderboard: 'vt-team-leaderboard'
vtOverdueTasks: 'vt-overdue-tasks'
vtReviewQueue: 'vt-review-queue'
vtTeamWorkload: 'vt-team-workload'
vtTeamBlockedTasks: 'vt-team-blocked-tasks'
```
