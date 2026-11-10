# Technique Monorepo

This repository is an npm-workspaces monorepo with three independently buildable apps:

- `frontend/`: Public-facing site (Vite + React)
- `backend/`: API server (Express + TypeScript)
- `dashboard/`: Authenticated editor CMS (Vite + TanStack Router)

App manifests own their app-specific dependencies. Shared development configuration
(including Biome) and the single npm lockfile live at the repository root.

## Setup

Install all workspace dependencies once from the repository root:

```sh
npm ci
```

Configure the backend environment, then run all three apps:

```sh
cp backend/.env.example backend/.env
npm run dev
```

This starts the API, public site, and dashboard at:

- Backend: `http://localhost:5050`
- Frontend: `http://localhost:5173`
- Dashboard: `http://localhost:5174`

### Run a workspace individually

```sh
npm run dev:api   # backend
npm run dev:web   # frontend
npm run dev:dash  # dashboard
```

Build all apps with `npm run build`; run backend tests with `npm test`. For deployments,
use the repository root as the install context and select the target workspace's build
and start scripts. The workspace package manifest keeps each app's deploy dependencies
separate while the root lockfile keeps installs reproducible.
