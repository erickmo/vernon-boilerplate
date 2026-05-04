# Empathy-Guided Dashboard Design

Date: 2026-05-04
Scope: `web-dashboard` dashboard home screen

## Goal

Redesign the dashboard into a guided workspace that reflects the company's value of empathy. The first screen should reduce cognitive load, help users understand what needs attention, and guide them toward useful next actions without feeling alarm-heavy or executive-distant.

## Direction

Use the Guided Workspace direction. The dashboard should feel calm, supportive, and operationally useful.

The screen will replace placeholder content with purposeful sections:

- A warm welcome area that names the current user and explains the workspace state.
- A primary next-action panel for the most important task.
- Supporting metric cards that explain status in human terms.
- A progress or readiness panel that shows what is already handled.
- Task cards for common flows such as reviewing audit activity, managing data, and inviting users.
- A recent activity section with plain-language entries.

## UX Principles

- Prioritize "what should I do next?" over raw KPI density.
- Use calm language and supportive labels.
- Keep operational information scannable for repeated use.
- Avoid decorative marketing patterns; this is still a working dashboard.
- Avoid placeholder instructions in the UI.
- Keep cards compact, responsive, and visually stable.

## Visual System

Reuse the existing React/Vite/CSS Modules stack and current design tokens. Keep the existing brand colors, but use them with more restraint:

- Primary purple for key action and selected emphasis.
- Teal/accent for progress and healthy states.
- Amber/secondary for helpful attention states.
- White/elevated surfaces with 8px-oriented card treatment where possible.

The current token palette is purple-led, so the dashboard should add enough neutral, teal, and amber balance to avoid a one-note purple screen.

## Component Plan

Implement the dashboard mostly inside:

- `web-dashboard/src/pages/Dashboard/DashboardPage.tsx`
- `web-dashboard/src/pages/Dashboard/DashboardPage.module.css`

Use small local components for readability:

- `MetricCard`
- `NextActionCard`
- `ProgressPanel`
- `TaskCard`
- `ActivityItem`

Use `lucide-react` icons for visual scanning. Do not add new dependencies.

## Data

Use static sample dashboard data for now, matching the existing boilerplate approach. Shape the data as arrays near the component so future API wiring can replace it cleanly.

## Responsive Behavior

- Desktop: two-column dashboard with a wider guidance/activity column and a narrower readiness/task column.
- Tablet: two-column metric cards and stacked content panels.
- Mobile: single-column layout, stable button sizing, no text overlap, and actions wrapping cleanly.

## Testing

Add focused UI tests for the dashboard:

- It renders the empathetic guided workspace content.
- It shows the user's name when available.
- It renders next action, progress, task cards, and activity entries.

Run the dashboard tests, lint, and production build before marking the implementation complete.
