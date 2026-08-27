# Nexus PM — Frontend

The React client for **Nexus PM**, a project-management workspace with a kanban board, task
filtering, team management, and an analytics dashboard. Dark-first premium UI, built on Vite.

---

## Quick start

```bash
# 1) install
cd pmt_frontend
npm install

# 2) run the dev server (http://localhost:5173)
npm run dev
```

The backend must be running as well — from the repo root:

```bash
cd pmt_backend
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8010
```

### Demo login

```
email:    demo@pmt.app
password: demo1234
```

Or create your own account from **Register** — a fresh account starts with an empty workspace.

---

## Dev proxy

The app talks to the API through the relative base URL `/api` (see `src/lib/api.ts`), so there is no
CORS setup and no environment variable to configure. Vite forwards those calls to FastAPI:

```ts
// vite.config.ts
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://127.0.0.1:8010', changeOrigin: true } },
}
```

If the backend runs on another host or port, change that `target`. For a production build, serve
`dist/` behind any web server that proxies `/api` to the API process.

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Vite dev server with HMR on port 5173           |
| `npm run build`     | Type-check (`tsc --noEmit`) then build to `dist` |
| `npm run preview`   | Serve the production build locally              |
| `npm run typecheck` | Type-check only                                 |

---

## Features

- **Dashboard** — KPI tiles, 14-day created/completed trend, status & priority breakdowns, team
  workload, upcoming due dates, and a live activity feed.
- **Projects** — create, edit, archive and delete projects; auto-generated project keys, colors,
  progress stats, and per-project member roles (owner / admin / member / viewer).
- **Kanban board** — five columns (Backlog → To Do → In Progress → In Review → Done) with drag &
  drop powered by dnd-kit and optimistic reordering.
- **Tasks** — priorities, assignees, due dates, estimates, labels, subtask checklists, comments,
  and a slide-over detail drawer.
- **Filtering** — full-text search plus status, priority, assignee, label and due-date filters
  (overdue / today / this week), shared by the board, the list view and My Tasks.
- **Team & Settings** — teammate directory, role management, profile editing, and a persisted
  light/dark theme toggle.

## Tech stack

| Area       | Choice                                             |
| ---------- | -------------------------------------------------- |
| UI         | React 19 + TypeScript (strict)                      |
| Build      | Vite 6                                              |
| Styling    | Tailwind CSS v4 (`@tailwindcss/vite`), CSS tokens   |
| Routing    | React Router v7                                     |
| Server data| TanStack Query v5                                   |
| Client state| Zustand (theme) + React context (auth)             |
| HTTP       | Axios with a JWT request interceptor                |
| Motion     | Framer Motion · **Icons** lucide-react              |
| Charts     | Recharts · **Toasts** Sonner · **DnD** dnd-kit      |

## Project layout

```
src/
  components/       shared UI + layout (AppShell, RouteGuards)
  features/         board, tasks and project feature modules
  hooks/queries.ts  every TanStack Query hook + query keys
  lib/              axios client (api, apiError, TOKEN_KEY) and helpers
  pages/            route-level screens (default exports)
  store/            auth context + theme store
  types.ts          shared API types
  index.css         Tailwind theme, design tokens, utility classes
```

Auth: the JWT is kept in `localStorage` under `pmt.token` and attached to every request; a 401
clears it and returns you to `/login`. The theme preference lives in `pmt.theme` and toggles the
`dark` class on `<html>`.
