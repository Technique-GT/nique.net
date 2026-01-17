# Dashboard Real Data Migration Plan (dashboard/ -> backend/)

Goal: Replace mocked dashboard data with real backend-powered data and statistics.

Scope:
- In scope: `dashboard/` app and any minimal `backend/` changes required to support dashboard workflows.
- Out of scope: `frontend/` public app migration (separate effort).
- Backend is the source of truth; adjust it when needed to support editing/review flows.

Non-goals (for this plan):
- Building a full site-traffic analytics pipeline in the backend.
- Implementing a chat or task system (these remain mocked for now).

---

## 0) Baselines / Guardrails

- [x] Confirm `VITE_API_BASE_URL` points to the production backend (and local fallback works).
- [x] Ensure `dashboard/src/lib/api-client.ts` uses `withCredentials: true` (Google OAuth session cookies).
- [x] Confirm backend CORS allows the dashboard origin (local + prod).
- [x] Rule: No `Math.random()`, hardcoded KPIs, or fixture JSON data in production pages, except the explicit exceptions below.

Allowed exceptions (must be labeled in UI as "Demo data"):
- [ ] `/_authenticated/tasks`
- [ ] `/_authenticated/chats`

---

## 1) Inventory: Mock Sources to Remove

These locations currently produce fake / hardcoded data:

- [x] Overview KPIs: `dashboard/src/features/dashboard/index.tsx`
- [x] Overview chart uses `Math.random()`: `dashboard/src/features/dashboard/components/overview.tsx`
- [x] "Recent" list is hardcoded: `dashboard/src/features/dashboard/components/recent-sales.tsx`
- [x] Analytics page uses arrays like `siteData`, `trafficSources`: `dashboard/src/features/maintenance/analytics.tsx`
- [x] Tasks dataset: `dashboard/src/features/tasks/data/tasks.ts` (allowed exception)
- [x] Chats dataset: `dashboard/src/features/chats/data/convo.json` (allowed exception)
- [x] Media fixture import: `dashboard/src/features/articles/article-creation/ArticleForm.tsx` imports `dashboard/src/data/media-library.json`

---

## 2) Backend Contracts (What We Can Rely On)

Relevant backend endpoints (mounted under `/api`):

Auth/session:
- [ ] `GET /api/auth/me`
- [ ] `GET /api/auth/google?redirect=...`
- [ ] `POST /api/auth/logout`

Articles:
- [ ] `GET /api/admin/articles?page&limit&search` (drafts + published)
- [ ] `POST /api/articles` (create)
- [ ] `PUT /api/articles/:id` (update)
- [ ] `PATCH /api/articles/:id/status` (publish/unpublish + flags)
- [ ] `PATCH /api/articles/:id/featured` (toggle)
- [ ] `PATCH /api/articles/:id/sticky` (toggle)
- [ ] `DELETE /api/articles/:id`

Taxonomy:
- [ ] `GET /api/categories`
- [ ] `GET /api/sub-categories`
- [ ] `GET /api/tags`

Users:
- [ ] `GET /api/users`

Media:
- [ ] `GET /api/media?page&limit&search`

Comments (admin):
- [ ] `GET /api/comments?page&limit&approved&articleId`
- [ ] `PATCH /api/comments/:id/status` with `{ approved: boolean }`
- [ ] `DELETE /api/comments/:id`
- [ ] `GET /api/comments/stats`

Collaborators (standalone resource):
- [ ] `GET /api/collaborators?search&status`

Important note:
- Articles in the backend do NOT have a `collaborators` field. Keep collaborator selection UI as "WIP" (not persisted to articles).

---

## 3) Phase 1: Standardize Data Fetching + TanStack Query Persistence

Objective: Make TanStack Query the single source of truth for server data across the dashboard and persist safe/valuable cache entries across reloads.

### 3.1) Standardize data access (services + apiClient)

- [x] Confirm `dashboard/src/lib/api-client.ts` unwraps `{ success, data }` and passes through non-wrapped responses.
- [x] Add/finish a thin services layer (one file per domain). No page-level `fetch()` calls.
  - [x] `dashboard/src/services/articles.ts`
  - [x] `dashboard/src/services/comments.ts`
  - [x] `dashboard/src/services/media.ts`
  - [x] `dashboard/src/services/taxonomy.ts`
  - [x] `dashboard/src/services/users.ts`
  - [x] `dashboard/src/services/collaborators.ts`

- [x] Standardize query keys for TanStack Query (examples):
  - [x] `['admin-articles', params]`
  - [x] `['comment-stats']`
  - [x] `['comments', params]`
  - [x] `['media', params]`
  - [x] `['categories']`, `['sub-categories']`, `['tags']`

### 3.2) Make TanStack Query own all server state

Rule: If it comes from the backend, it should not live in `useState` as the authoritative copy.

- [x] Replace remaining `useEffect + fetch + setState` patterns with `useQuery` / `useMutation`.
- [x] After mutations, update UI via `queryClient.invalidateQueries(...)` (or safe optimistic updates).
- [x] Use `placeholderData` (or `keepPreviousData`) for paginated lists to prevent flashing/empty transitions.

### 3.3) Persist query cache across reloads (localStorage)

Goal: avoid weird reload behavior and keep "reference" data stable without bloating storage or persisting sensitive data.

- [x] Add dependencies:
  - [x] `@tanstack/react-query-persist-client`
  - [x] `@tanstack/query-sync-storage-persister`

- [x] Update `dashboard/src/main.tsx` to enable persistence using `PersistQueryClientProvider` (or `persistQueryClient`):
  - [x] persister: `createSyncStoragePersister({ storage: window.localStorage, key: 'dashboard-rq-cache' })`
  - [x] set `maxAge` (default: 15 minutes)
  - [x] set `buster` tied to app version (invalidate cache on deploy)

- [x] Only persist a safe subset of queries.
  - [x] Persist by opt-in: `meta: { persist: true }` on queries.
  - [x] `shouldDehydrateQuery` checks `query.meta?.persist === true`.

Recommended persistence allowlist (default):
- [x] Taxonomy lookups: categories/subcategories/tags
- [x] Collaborators
- [x] Small stats/KPIs: comment stats, dashboard KPIs
- [x] Playlists

Do not persist:
- [x] Auth/session (`/auth/me`) and anything sensitive
- [x] Large/fast-changing lists (admin articles pages, comments list, users list, media)

### 3.4) Persist filter/pagination state in the URL (not React Query)

- [ ] Put list filters/search/page into TanStack Router search params so refresh/back/forward behave consistently.
- [x] React Query keys include those params, e.g. `['admin-articles', { page, search, status }]`.

Check:
- [x] Pages show loading + error + empty states (no silent failures).
- [x] Route changes do not double-fetch or "flash" stale content.
- [x] Refresh keeps persisted reference data without persisting sensitive data.

---

## 4) Phase 2: Replace Overview (/dash)

Objective: Remove hardcoded KPIs, random chart data, and static recent list.

KPIs (backend-derived):
- [x] Published articles (last 30 days): derived from `GET /api/admin/articles` and `publishedAt`.
- [x] Draft count: derived from `published === false`.
- [x] Total views: sum of `viewCount` across fetched articles.
- [x] Pending comments: from `GET /api/comments/stats`.

Chart (replace `Math.random()`):
- [x] Chart shows "Articles published per month" for last 12 months (bucket by `publishedAt`).
- [x] Axis units are correct (no `$` formatting).

Recent list (replace hardcoded `RecentSales`):
- [x] Show 5 most recently published articles.
- [x] Display: title, category name, viewCount, published date.

Files likely touched:
- [x] `dashboard/src/features/dashboard/index.tsx`
- [x] `dashboard/src/features/dashboard/components/overview.tsx`
- [x] `dashboard/src/features/dashboard/components/recent-sales.tsx`

Checks:
- [x] No hardcoded KPI values remain.
- [x] No `Math.random()` remains.
- [x] Refreshing page shows consistent values.

---

## 5) Phase 3: Replace Maintenance Analytics (/maintenance/analytics)

Objective: Replace all mock "site analytics" widgets with content analytics based on backend data.

Replace these mock datasets:
- [x] `siteData` -> remove or replace with content metrics.
- [x] `trafficSources` -> remove or replace with content groupings.
- [x] `articleData` -> replace with real aggregations.

Proposed content analytics widgets (all real):
- [x] Top articles by views (viewCount)
- [x] Views by category (sum viewCount grouped by category)
- [x] Articles published over time (daily/weekly/monthly buckets)
- [x] Comments approval ratio (approved vs pending from `/comments/stats`)

Optional later (not part of this plan unless explicitly approved):
- Cloudflare traffic analytics via a Cloudflare Worker proxy.

Files likely touched:
- [x] `dashboard/src/features/maintenance/analytics.tsx`

Checks:
- [x] No hardcoded chart arrays remain.
- [x] Charts render deterministically based on API responses.

---

## 6) Phase 4: Fix Comments Moderation (/maintenance/comments)

Objective: Use the backend admin comment endpoints for listing + moderation.

- [x] Wire stats cards to `GET /api/comments/stats`.
- [x] Wire table to `GET /api/comments?page&limit&approved=...`.
- [x] Approve/unapprove uses `PATCH /api/comments/:id/status` with `{ approved: boolean }`.
- [x] Delete uses `DELETE /api/comments/:id`.

Data shape alignment:
- [x] Use backend `username` (do not expect `author.name` / avatar).
- [x] Use backend `thumbsUp` / `thumbsDown` if displayed.

File likely touched:
- [x] `dashboard/src/features/maintenance/comments.tsx`

Checks:
- [x] Pending/approved filters work.
- [x] Approve/unapprove updates UI and refetches correctly.
- [x] Delete removes comment and refetches correctly.

---

## 7) Phase 5: Article Creation + Submission (Critical Contract Fix)

Objective: Ensure new articles can be created as drafts or published immediately using backend field names.

Current issues:
- The article form uses `featuredImage`, `status`, `category`, `tags`, `subcategory` which do not match backend schema.

Required fixes:
- [x] Replace raw `fetch` calls with `apiClient`.
- [x] Map payload fields to backend schema:
  - [x] `categoryId` (not `category`)
  - [x] `subcategoryId` (not `subcategory`)
  - [x] `tagIds` (not `tags`)
  - [x] `featuredMediaId` (not `featuredImage`)
  - [x] `published: boolean` (not `status`)
  - [x] Use `imageCaption` for the UI "Caption" field
- [x] Authors picker includes all users from `GET /api/users` (no role/status filtering).
- [x] Featured/sticky flags only allowed when `published === true` (backend enforces; UI should mirror).

Media selection (browse-only):
- [x] Replace `dashboard/src/data/media-library.json` usage with `GET /api/media`.
- [x] MediaPicker supports searching/browsing (mostly implemented via article-creation load).

Collaborators note (WIP):
- [x] Keep collaborator selection UI but add a clear note: "WIP: collaborators are not yet linked to articles in the backend".
- [x] Do not send collaborators in the article payload.

Files likely touched:
- [ ] `dashboard/src/features/articles/article-creation/article-creation.tsx`
- [ ] `dashboard/src/features/articles/article-creation/ArticleForm.tsx`
- [ ] `dashboard/src/features/articles/article-creation/ArticleSubmission.tsx`

Checks:
- [x] Create draft succeeds (201) and appears in the article library.
- [x] Publish immediately succeeds and appears as published.
- [x] Featured/sticky cannot be enabled for drafts.

---

## 8) Phase 6: Article Editor + Review Workflow + Permissions

Objective: Move editing out of modals into a dedicated editor route, support drafts + autosave, and enforce a permissions model with owner/admin review flow.

URL + navigation:
- [x] Remove `/articles/new` route entirely (and sidebar entry).
- [x] Add editor route: `/articles/:id/edit`.
- [x] “New Article” button creates a draft immediately, then navigates to `/articles/:id/edit`.
- [x] “Edit” from library navigates to `/articles/:id/edit` (no modal flyout).

Permissions + roles (backend):
- [x] Keep `User.isAdmin: boolean`.
- [x] Add `Article.ownerId` (immutable owner).
- [x] Owner/admin can manage authors; non-owner authors can edit but cannot change author list.
- [x] Only admin can publish/unpublish.
- [x] Review workflow:
- [x] owner can request review; while in review the article is locked for edits.
- [x] owner can unrequest review (returns to draft/unlocked).
- [x] admin can approve publish; admin unpublish returns to draft.
- [x] Admin can transfer ownership.

Rich text persistence:
- [x] Store Lexical state in the backend as `Article.editorState` in addition to HTML `Article.content`.
- [x] Editor loads from `editorState` (preferred) and generates `content` HTML for rendering.

Backend endpoints (suggested under `/api/admin`):
- [x] `POST /api/admin/articles/draft` -> creates draft with `ownerId` and returns new article.
- [x] `GET /api/admin/articles/:id` -> full article (drafts included), does NOT increment viewCount.
- [x] `PATCH /api/admin/articles/:id` -> save updates (autosave + manual save).
- [x] `PATCH /api/admin/articles/:id/authors` -> owner/admin only.
- [x] `POST /api/admin/articles/:id/request-review` -> owner/admin.
- [x] `POST /api/admin/articles/:id/unrequest-review` -> owner/admin.
- [x] `POST /api/admin/articles/:id/publish` -> admin only.
- [x] `POST /api/admin/articles/:id/unpublish` -> admin only.
- [x] `POST /api/admin/articles/:id/transfer-ownership` -> admin only.

Dashboard changes:
- [x] Remove edit dialog state and `ArticleDialogs` edit UI.
- [x] Implement editor page that:
- [x] loads article via admin endpoint
- [x] initializes Lexical from `editorState`
- [x] autosaves (debounced)
- [x] shows “Request review” for owners, publish/unpublish for admins.

Files likely touched:
- [x] `dashboard/src/features/articles/article-library/list.tsx`
- [x] `dashboard/src/components/layout/data/sidebar-data.ts`
- [x] `dashboard/src/routes/_authenticated/articles/$articleId/edit.tsx` (new)
- [x] `dashboard/src/features/articles/article-creation/*` (refactor to support edit route)
- [x] `backend/src/models/Article.ts`
- [x] `backend/src/routes/admin.articles.routes.ts`
- [x] `backend/src/controllers/article.controller.ts` (or new admin controller)
- [x] `backend/src/middleware/auth.middleware.ts` + new authorizer helper

Checks:
- [ ] Non-admin can create draft, edit, manage authors (if owner), delete draft.
- [ ] Non-owner author can edit/save draft but cannot change authors.
- [ ] Owner can request review, article becomes locked.
- [ ] Owner can unrequest review, unlocks.
- [ ] Admin can publish/unpublish and transfer ownership.


---

## 9) Phase 7: Media Library (Browse + Pick)

Objective: Replace any remaining fixture-based media lists.

- [x] Media page lists media from `GET /api/media?page&limit&search`.
- [x] Reuse this data source in the article creation MediaPicker.
- [x] Display: thumbnail (if image), altText, URL, created ordering.

Checks:
- [x] Searching works.
- [x] Picking a media item sets `featuredMediaId` and saves on create/edit.

---

## 10) Phase 8: Mark Chats/Tasks as Demo (Only Mocked Areas)

- [x] Add a small "Demo data" label/badge to Tasks page.
- [x] Add a small "Demo data" label/badge to Chats page.
- [ ] Ensure no other production page imports their mock datasets.

---

## 11) Verification Checklist (Manual + Commands)

Local run:
- [ ] Backend: `cd backend && npm run dev`
- [ ] Dashboard: `cd dashboard && npm run dev`

Manual flows:
- [ ] Login with Google works; `GET /api/auth/me` returns user.
- [ ] `/dash` loads real KPIs + chart + recent.
- [ ] `/maintenance/analytics` shows real content analytics.
- [ ] `/maintenance/comments` can approve/unapprove and delete.
- [ ] Article create (draft) works.
- [ ] Article create (publish) works.
- [ ] Article edit works.
- [ ] Media browse works and featured media selection persists.
- [ ] Only tasks/chats remain mocked and labeled.

Build:
- [ ] `cd dashboard && npm run build`

---

## 12) Rollout / Incremental Delivery

Recommended merge order (each can be a separate PR):
- [x] PR 1: Services + Overview real data
- [x] PR 2: Comments moderation + analytics content metrics
- [x] PR 3: Article creation payload fix + media browse/picker
- [x] PR 4: Article library pagination + edit payload cleanup
- [x] PR 5: Mark tasks/chats as demo
