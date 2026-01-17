# Dashboard Real Data Migration Plan (dashboard/ -> backend/)

Goal: Replace mocked dashboard data with real backend-powered data and statistics, without modifying `backend/`.

Scope:
- In scope: `dashboard/` app.
- Out of scope: `frontend/` public app migration (separate effort).
- Backend is source of truth. Do not edit `backend/`.

Non-goals (for this plan):
- Building a full site-traffic analytics pipeline in the backend.
- Implementing a chat or task system (these remain mocked for now).

---

## 0) Baselines / Guardrails

- [ ] Confirm `VITE_API_BASE_URL` points to the production backend (and local fallback works).
- [ ] Ensure `dashboard/src/lib/api-client.ts` uses `withCredentials: true` (Google OAuth session cookies).
- [ ] Confirm backend CORS allows the dashboard origin (local + prod).
- [ ] Rule: No `Math.random()`, hardcoded KPIs, or fixture JSON data in production pages, except the explicit exceptions below.

Allowed exceptions (must be labeled in UI as "Demo data"):
- [ ] `/_authenticated/tasks`
- [ ] `/_authenticated/chats`

---

## 1) Inventory: Mock Sources to Remove

These locations currently produce fake / hardcoded data:

- [ ] Overview KPIs: `dashboard/src/features/dashboard/index.tsx`
- [ ] Overview chart uses `Math.random()`: `dashboard/src/features/dashboard/components/overview.tsx`
- [ ] "Recent" list is hardcoded: `dashboard/src/features/dashboard/components/recent-sales.tsx`
- [ ] Analytics page uses arrays like `siteData`, `trafficSources`: `dashboard/src/features/maintenance/analytics.tsx`
- [ ] Tasks dataset: `dashboard/src/features/tasks/data/tasks.ts` (allowed exception)
- [ ] Chats dataset: `dashboard/src/features/chats/data/convo.json` (allowed exception)
- [ ] Media fixture import: `dashboard/src/features/articles/article-creation/ArticleForm.tsx` imports `dashboard/src/data/media-library.json`

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

## 3) Phase 1: Standardize Data Fetching (Services + React Query)

Objective: Make it easy to replace mocks without scattering fetch logic.

- [ ] Confirm `dashboard/src/lib/api-client.ts` unwraps `{ success, data }` and passes through non-wrapped responses.
- [ ] Add a thin services layer (one file per domain):
  - [ ] `dashboard/src/services/articles.ts`
  - [ ] `dashboard/src/services/comments.ts`
  - [ ] `dashboard/src/services/media.ts`
  - [ ] `dashboard/src/services/taxonomy.ts`
  - [ ] `dashboard/src/services/users.ts`
  - [ ] `dashboard/src/services/collaborators.ts`
- [ ] Standardize query keys for React Query (examples):
  - [ ] `['admin-articles', params]`
  - [ ] `['comment-stats']`
  - [ ] `['comments', params]`
  - [ ] `['media', params]`

Check:
- [ ] Pages show loading + error + empty states (no silent failures).

---

## 4) Phase 2: Replace Overview (/dash)

Objective: Remove hardcoded KPIs, random chart data, and static recent list.

KPIs (backend-derived):
- [ ] Published articles (last 30 days): derived from `GET /api/admin/articles` and `publishedAt`.
- [ ] Draft count: derived from `published === false`.
- [ ] Total views: sum of `viewCount` across fetched articles.
- [ ] Pending comments: from `GET /api/comments/stats`.

Chart (replace `Math.random()`):
- [ ] Chart shows "Articles published per month" for last 12 months (bucket by `publishedAt`).
- [ ] Axis units are correct (no `$` formatting).

Recent list (replace hardcoded `RecentSales`):
- [ ] Show 5 most recently published articles.
- [ ] Display: title, category name, viewCount, published date.

Files likely touched:
- [ ] `dashboard/src/features/dashboard/index.tsx`
- [ ] `dashboard/src/features/dashboard/components/overview.tsx`
- [ ] `dashboard/src/features/dashboard/components/recent-sales.tsx`

Checks:
- [ ] No hardcoded KPI values remain.
- [ ] No `Math.random()` remains.
- [ ] Refreshing page shows consistent values.

---

## 5) Phase 3: Replace Maintenance Analytics (/maintenance/analytics)

Objective: Replace all mock "site analytics" widgets with content analytics based on backend data.

Replace these mock datasets:
- [ ] `siteData` -> remove or replace with content metrics.
- [ ] `trafficSources` -> remove or replace with content groupings.
- [ ] `articleData` -> replace with real aggregations.

Proposed content analytics widgets (all real):
- [ ] Top articles by views (viewCount)
- [ ] Views by category (sum viewCount grouped by category)
- [ ] Articles published over time (daily/weekly/monthly buckets)
- [ ] Comments approval ratio (approved vs pending from `/comments/stats`)

Optional later (not part of this plan unless explicitly approved):
- Cloudflare traffic analytics via a Cloudflare Worker proxy.

Files likely touched:
- [ ] `dashboard/src/features/maintenance/analytics.tsx`

Checks:
- [ ] No hardcoded chart arrays remain.
- [ ] Charts render deterministically based on API responses.

---

## 6) Phase 4: Fix Comments Moderation (/maintenance/comments)

Objective: Use the backend admin comment endpoints for listing + moderation.

- [ ] Wire stats cards to `GET /api/comments/stats`.
- [ ] Wire table to `GET /api/comments?page&limit&approved=...`.
- [ ] Approve/unapprove uses `PATCH /api/comments/:id/status` with `{ approved: boolean }`.
- [ ] Delete uses `DELETE /api/comments/:id`.

Data shape alignment:
- [ ] Use backend `username` (do not expect `author.name` / avatar).
- [ ] Use backend `thumbsUp` / `thumbsDown` if displayed.

File likely touched:
- [ ] `dashboard/src/features/maintenance/comments.tsx`

Checks:
- [ ] Pending/approved filters work.
- [ ] Approve/unapprove updates UI and refetches correctly.
- [ ] Delete removes comment and refetches correctly.

---

## 7) Phase 5: Article Creation + Submission (Critical Contract Fix)

Objective: Ensure new articles can be created as drafts or published immediately using backend field names.

Current issues:
- The article form uses `featuredImage`, `status`, `category`, `tags`, `subcategory` which do not match backend schema.

Required fixes:
- [ ] Replace raw `fetch` calls with `apiClient`.
- [ ] Map payload fields to backend schema:
  - [ ] `categoryId` (not `category`)
  - [ ] `subcategoryId` (not `subcategory`)
  - [ ] `tagIds` (not `tags`)
  - [ ] `featuredMediaId` (not `featuredImage`)
  - [ ] `published: boolean` (not `status`)
  - [ ] Use `imageCaption` for the UI "Caption" field
- [ ] Authors picker includes all users from `GET /api/users` (no role/status filtering).
- [ ] Featured/sticky flags only allowed when `published === true` (backend enforces; UI should mirror).

Media selection (browse-only):
- [ ] Replace `dashboard/src/data/media-library.json` usage with `GET /api/media`.
- [ ] MediaPicker supports searching/browsing (no upload UI in this phase).

Collaborators note (WIP):
- [ ] Keep collaborator selection UI but add a clear note: "WIP: collaborators are not yet linked to articles in the backend".
- [ ] Do not send collaborators in the article payload.

Files likely touched:
- [ ] `dashboard/src/features/articles/article-creation/article-creation.tsx`
- [ ] `dashboard/src/features/articles/article-creation/ArticleForm.tsx`
- [ ] `dashboard/src/features/articles/article-creation/ArticleSubmission.tsx`

Checks:
- [ ] Create draft succeeds (201) and appears in the article library.
- [ ] Publish immediately succeeds and appears as published.
- [ ] Featured/sticky cannot be enabled for drafts.

---

## 8) Phase 6: Article Library + Edit Dialog Consistency

Objective: Ensure list/edit/quick actions align with backend schema and do not rely on legacy fields.

- [ ] Article list uses `GET /api/admin/articles` with pagination (no `limit=100` forever; implement page/limit).
- [ ] Quick publish uses `PATCH /api/articles/:id/status`.
- [ ] Quick feature/sticky uses `PATCH /api/articles/:id/featured` and `/sticky`.
- [ ] Edit dialog updates only backend-supported fields:
  - [ ] title, slug, content, excerpt, categoryId, subcategoryId, tagIds, authors, featuredMediaId, imageCaption, published, allowComments, isFeatured, isSticky
- [ ] Remove/ignore non-existent fields in edit payloads (seo fields, collaborators on articles, etc.).

Files likely touched:
- [ ] `dashboard/src/features/articles/article-library/useArticles.ts`
- [ ] `dashboard/src/features/articles/article-library/list.tsx`
- [ ] `dashboard/src/features/articles/article-library/ArticleDialogs.tsx`

Checks:
- [ ] Edit save persists and refetches.
- [ ] Toggling publish/featured/sticky reflects backend rules.

---

## 9) Phase 7: Media Library (Browse + Pick)

Objective: Replace any remaining fixture-based media lists.

- [ ] Media page lists media from `GET /api/media?page&limit&search`.
- [ ] Reuse this data source in the article creation MediaPicker.
- [ ] Display: thumbnail (if image), altText, URL, created ordering.

Checks:
- [ ] Searching works.
- [ ] Picking a media item sets `featuredMediaId` and saves on create/edit.

---

## 10) Phase 8: Mark Chats/Tasks as Demo (Only Mocked Areas)

- [ ] Add a small "Demo data" label/badge to Tasks page.
- [ ] Add a small "Demo data" label/badge to Chats page.
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
- [ ] PR 1: Services + Overview real data
- [ ] PR 2: Comments moderation + analytics content metrics
- [ ] PR 3: Article creation payload fix + media browse/picker
- [ ] PR 4: Article library pagination + edit payload cleanup
- [ ] PR 5: Mark tasks/chats as demo
