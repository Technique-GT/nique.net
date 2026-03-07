# AGENTS.md

School newspaper platform: public-facing website + authenticated dashboard + shared Express backend.

## Architecture

```
├── frontend/          # Public site (Vite + React Router) - read-only, no auth
├── dashboard/         # CMS for editors/admins (Vite + TanStack Router) - authenticated
├── backend/           # Express + TypeScript API serving both frontends
└── PLAN.md            # Current task tracking and future work
```

### Critical Security Boundary

The backend serves BOTH the unauthenticated public frontend AND the authenticated dashboard. Every protected route must explicitly verify auth—there is no implicit protection.

## Commands

### Setup
```bash
# Install all dependencies
npm install                          # root
cd frontend && npm install
cd dashboard && npm install  
cd backend && npm install

# Environment
cp backend/.env.example backend/.env # then fill in values
```

### Development
```bash
# Backend (must run first)
cd backend && npm run dev            # http://localhost:5050

# Frontend (public site)
cd frontend && npm run dev           # http://localhost:5173

# Dashboard (CMS)
cd dashboard && npm run dev          # http://localhost:5174
```

### Testing & Linting
```bash
cd backend && npm test               # API tests
cd backend && npm run lint           # ESLint
cd frontend && npm run lint
cd dashboard && npm run lint
npm run typecheck                    # if available
```

## API Conventions

- Base URL: `VITE_API_BASE_URL` (default `http://localhost:5050/api`)
- Response wrapper: `{ success: boolean, data: T, pagination?: {...} }`
- Dashboard services in `dashboard/src/services/*` unwrap via `api-client.ts`
- Auth tokens: Check how they're stored (httpOnly cookies vs localStorage) and validated

## Code Style

- TypeScript strict mode in all packages
- Prefer named exports
- Services handle API calls; components handle UI
- Fix contract mismatches in services/adapters before touching UI

## Current Focus

Dashboard + backend review/publishing workflow. See `PLAN.MD` for active tasks.

- Scope changes to `dashboard/src/` and `backend/` unless instructed otherwise
- `frontend/` is NOT in scope currently

## Security Audit Checklist

When reviewing this codebase for security, prioritize these areas:

### Authentication (Dashboard Only)
- [ ] How are sessions/tokens created, stored, and validated?
- [ ] Is there rate limiting on `/api/auth/*` routes?
- [ ] Session expiration and invalidation on logout
- [ ] Password hashing algorithm (should be bcrypt/argon2)

### Authorization (CRITICAL - Shared Backend Risk)
- [ ] Are ALL dashboard routes protected by auth middleware?
- [ ] Is middleware applied consistently (not inline per-route)?
- [ ] IDOR: Can user A access/modify user B's articles by changing IDs?
- [ ] Role checks: Are editor vs admin permissions enforced server-side?
- [ ] Can unauthenticated requests from the public frontend hit protected endpoints?

### Input Validation
- [ ] SQL/NoSQL injection in search, filters, article content
- [ ] Stored XSS in article bodies, author bios, comments
- [ ] File upload validation for article images (type, size, filename)

### Data Exposure  
- [ ] API responses leaking sensitive fields (emails, passwords, drafts)
- [ ] Secrets in frontend bundles (check `import.meta.env`)
- [ ] Source maps in production builds
- [ ] CORS configuration (should whitelist specific origins)

### Business Logic
- [ ] Can unpublished/draft articles be accessed via direct URL?
- [ ] Can publish dates or article status be manipulated?

## Boundaries

- Never commit secrets or `.env` files
- Never modify auth middleware without explicit approval
- Never auto-merge security-related changes
- Add future work to `PLAN.MD`, not inline TODOs
- When uncertain about a security finding, flag it—don't dismiss

## Proof of Completion

Before finishing any task:
1. `npm run lint` passes in affected packages
2. `npm test` passes (if tests exist)
3. No TypeScript errors
4. For security audits: findings documented with severity, location, and remediation