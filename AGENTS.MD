# Agent Notes (technique)

This repo contains multiple apps:
- `frontend/`: public-facing React app (Vite). This is the current focus.
- `dashboard/`: separate frontend/admin app (out of scope for this migration).
- `backend/`: Express backend (TS) with the intended contracts. Do not edit unless explicitly requested.

## Current Task

Migrate `frontend/` to talk to `backend/` without modifying `backend/`.

Read and follow the plan:
- Refer to `PLAN.MD` for the full migration approach, endpoint mapping, and adapter strategy.

## Key Conventions / Facts

### API base URL
`frontend/` currently uses:
- `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api'`

`backend/` listens on `PORT` (default 5050) and mounts routes under `/api`.

### Backend response shape
Many `backend/` endpoints return wrapped payloads:
- `{ success: true, data: ... }`
- sometimes include `pagination`.

The `frontend/` UI often expects the raw data directly.

### Where to change things
Prefer to localize changes to:
- `frontend/src/services/*`
- `frontend/src/services/apiClient.ts`

Avoid broad edits across React pages/components unless adapters cannot bridge a mismatch.

### Known shape mismatches
- Articles: `backend` uses `categoryId`, `tagIds`, `featuredMediaId`, and `authors[].authorId` (often populated).
  The UI expects `categories[]`, `tags[]`, `featuredImage`, and `authors[].user`.
- Comments: `backend` uses `username`; UI expects `author.name` and `author.avatar`.
- Feed pagination: `backend` feed is page-based; UI infinite scroll is offset-based.

## Practical Guidance

- If a UI screen breaks due to contract mismatch, fix it in the service/adapters first.
- Treat `backend/` only as a reference for legacy endpoints; do not align to it.
- Keep any future-facing notes in code minimal; prefer adding considerations to `PLAN.MD`.
