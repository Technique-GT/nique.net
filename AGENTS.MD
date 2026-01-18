# Agent Notes (technique)

This repo contains multiple apps:
- `dashboard/`: admin dashboard (current focus for review/publish workflow and real-data wiring).
- `backend/`: Express backend (TS) providing the contracts; adjust here as needed to support the dashboard flows.
- `frontend/`: public-facing React app (Vite). Not in scope right now.

## Current Task

Focus on the dashboard + backend review/publishing workflow and real data. See `PLAN.MD` for the latest plan.

## Key Conventions / Facts

- API base: `VITE_API_BASE_URL` with `/api` on the backend (default http://localhost:5050/api).
- Backend often wraps responses as `{ success, data, pagination }`; the dashboard services unwrap via `api-client`.
- Prefer changes in `dashboard/src/services/*` and `backend/` controllers/routes/models that support the dashboard workflow.

## Practical Guidance

- Fix contract mismatches in services/adapters first before touching UI screens.
- Keep scope to dashboard + backend until further notice.
- Add future-facing notes to `PLAN.MD` rather than scattering comments.
