# Technique Monorepo

This repository contains multiple apps:

- `frontend/`: Public-facing site (Vite + React)
- `backend/`: API server (Express + TypeScript)
- `dashboard/`: Admin app (currently not wired into root scripts)

## Quick Start (frontend + backend)

Install dependencies for the whole repo (npm workspaces):

```sh
npm install
```

Then start both apps from the repo root:

```sh
npm run dev
```

This starts:

- `backend`: `npm --prefix backend run dev`
- `frontend`: `npm --prefix frontend run dev`

### Run individually

```sh
npm run dev:api
npm run dev:web
```
