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

## Linting, formatting, and unused-code checks

Run these commands from the repository root. The tools and scripts are defined in the
root package, so they check the monorepo rather than requiring you to enter each
workspace.

[Biome](https://biomejs.dev/) is the shared linter and formatter. It checks code for
common problems and applies consistent formatting and import organization:

```sh
npm run check        # report lint, formatting, and import-organization issues
npm run check:fix    # apply safe fixes and formatting
npm run check:unsafe # also enable Biome's potentially unsafe fixes
```

Review the changes from either fix command before committing, especially after using
`check:unsafe`.

[Knip](https://knip.dev/) finds unused files, exports, and dependencies across the
workspaces. Removing genuinely unused code and packages keeps the project easier to
maintain and avoids carrying unnecessary dependencies:

```sh
npm run knip         # show up to five issues
npm run knip:verbose # show the full issue list
npm run knip:fix     # let Knip automatically fix supported findings
```

Review Knip's findings before removing code or dependencies; some files or exports may
be used indirectly and need to be retained or configured as entry points.
