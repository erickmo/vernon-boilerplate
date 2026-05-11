# Vernon Corp 2 — UI for Vernon Tasks

## Project Context

This repo is the **frontend UI** for the `vernon_tasks` Frappe app.

- **Backend:** `../frappe/apps/vernon_tasks` (Frappe v15+, Python)
- **API docs:** `../frappe/apps/vernon_tasks/docs/API_REFERENCE.md`
- **Dev guide:** `../frappe/apps/vernon_tasks/docs/DEVELOPER_GUIDE.md`
- **`api/` directory is DEPRECATED** — do not write new code against it. All API calls go to Frappe.

## Communication

- Use caveman mode by default.
- Keep responses terse, direct, and technical.

## API Integration

### Base patterns

```
# Custom endpoints (business logic)
POST /api/method/<dotted.python.path>
Content-Type: application/json
X-Frappe-CSRF-Token: <token>

# Standard CRUD
GET|POST|PUT|DELETE /api/resource/<DocType>
```

### Auth

- **Browser:** session cookie auto-handled; send `X-Frappe-CSRF-Token` on every mutating request
- **Server-to-server:** `Authorization: token <api_key>:<api_secret>`
- CSRF token: read from `frappe.csrf_token` in JS context

### Response envelope

```json
{ "message": <value> }          // custom endpoints
{ "data": <value> }             // /api/resource/* endpoints
```

Errors: HTTP 4xx/5xx + `_server_messages` array in body.

## Key API Endpoints

### My Work Page (`VT Member`)
| Method path | Purpose |
|---|---|
| `vernon_tasks.task.page.my_work.my_work.get_my_day` | Today's scheduled tasks |
| `vernon_tasks.task.page.my_work.my_work.get_what_to_do_today` | Unblocked tasks due ≤3 days |
| `vernon_tasks.task.page.my_work.my_work.get_my_blocked_tasks` | Blocked tasks |
| `vernon_tasks.task.page.my_work.my_work.start_task` | BACKLOG/PLAN → DO |
| `vernon_tasks.task.page.my_work.my_work.submit_for_review` | DO → CHECK |

### My Dashboard Page (`VT Member`)
| Method path | Purpose |
|---|---|
| `vernon_tasks.task.page.my_dashboard.my_dashboard.get_employee_stats` | Points, done counts |
| `vernon_tasks.task.page.my_dashboard.my_dashboard.get_daily_completions` | Last 7 days chart data |
| `vernon_tasks.task.page.my_dashboard.my_dashboard.get_hours_summary` | Actual vs estimated hours |

### Leader Dashboard (`VT Leader` / `VT Manager`)
| Method path | Purpose |
|---|---|
| `vernon_tasks.task.page.leader_dashboard.leader_dashboard.get_leader_stats` | Team summary |
| `vernon_tasks.task.page.leader_dashboard.leader_dashboard.get_phase_distribution` | Tasks per PDCA phase |
| `vernon_tasks.task.page.leader_dashboard.leader_dashboard.get_team_leaderboard` | Top 10 by points |
| `vernon_tasks.task.page.leader_dashboard.leader_dashboard.get_overdue_tasks` | Overdue list |

### Leader Review (`VT Leader` / `VT Manager`)
| Method path | Purpose |
|---|---|
| `vernon_tasks.task.page.leader_review.leader_review.get_review_queue` | CHECK-phase queue |
| `vernon_tasks.task.page.leader_review.leader_review.get_team_workload` | Hours per member |
| `vernon_tasks.task.page.leader_review.leader_review.get_team_blocked_tasks` | Blocked tasks |
| `vernon_tasks.task.page.leader_review.leader_review.approve_task` | CHECK → DONE |
| `vernon_tasks.task.page.leader_review.leader_review.reject_task` | CHECK → DO + note |

## PDCA Lifecycle

```
BACKLOG → PLAN → DO → CHECK → DONE
                         ↓
                        ACT → DO
```

| PDCA Phase | Kanban Status |
|---|---|
| BACKLOG | Open |
| PLAN | Open |
| DO | In Progress |
| CHECK | In Review |
| ACT | In Progress |
| DONE | Completed |

## Roles

| Role | Access |
|---|---|
| `VT Member` | My Work, My Dashboard |
| `VT Leader` | + Leader Dashboard, Leader Review, point overrides |
| `VT Manager` | All Leader permissions + admin |

## Key Doctypes

- **VT Task** — `name`, `title`, `project`, `assigned_to`, `pdca_phase`, `priority`, `deadline`, `estimated_hours`, `earned_points`
- **VT Project** — `name`, `project_name`, `project_leader`, `pdca_phase`
- **User Point Summary** — monthly `net_points` per user
- **VT Settings** — app-wide rate config (read-only from UI)
