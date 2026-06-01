# Costarella Transportation — Fleet & Mobility

A demo fleet-management dashboard built with **React + TypeScript + Vite**. It covers
vehicle/driver/work-order management, role-based access control, an audit log, a
telematics map, and an API-backed Vehicles module with loading/error handling.

> All data is mock and in-memory — it resets on page reload. The data layer
> (`src/api.ts`) is written like a real REST client so it can be swapped for a
> live backend by changing only the method bodies.

## Features

- **Dashboard** — fleet KPIs and charts (cost trend, status mix, powertrain).
- **Vehicles** — full CRUD backed by a mock async API, with loading skeletons,
  error + retry states, and a "Simulate outage" toggle for demoing failures.
- **Vehicle detail** — drill-down with specs, assigned driver, service history,
  and last-known position.
- **Drivers** & **Maintenance** — CRUD roster and a Kanban work-order board.
- **Telematics** — an SVG map of the fleet's Ohio footprint.
- **Audit log** — every create/edit/delete is recorded with actor, timestamp,
  and field-level before/after diffs.
- **Role-based access** — Admin, Fleet Manager, Maintenance Tech, and Driver,
  with tab visibility and action permissions gated per role.

## Project structure

```
src/
  types.ts      # domain model, reducer action union, shared types
  data.ts       # seed data + theme tokens
  roles.ts      # role/permission matrix + can()/canSeeTab() helpers
  api.ts        # mock async fleet API (swap for a real backend here)
  reducer.ts    # state mutations + audit logging
  App.tsx       # all UI components
  main.tsx      # entry point
```

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build & type-check

```bash
npm run build    # tsc + vite production build into dist/
npm run lint     # tsc --noEmit (type-check only)
```

## Deploy to GitHub Pages

1. Set `base` in `vite.config.ts` to match your repo name (default `/fleet-mobility/`).
2. `npm run deploy` (builds and pushes `dist/` to the `gh-pages` branch).
3. In the repo: **Settings → Pages → Source: `gh-pages` branch**.

Alternatively, deploy with **Vercel** or **Netlify** by connecting the repo —
both auto-detect Vite. If you do, set `base` back to `"/"` in `vite.config.ts`.
