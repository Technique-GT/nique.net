# Frontend -> backend Migration Plan

Goal: point the existing `frontend/` app at `backend/` without modifying `backend/`.

**Approach: Contract-Aligned (No Adapters)**

The frontend types and components will be updated to match `backend` shapes directly.
This ensures consistency from database -> backend -> frontend with no translation layer.

Constraints / assumptions:
- Only migrate `frontend/` right now (ignore `dashboard/`).
- `backend/` is the source of truth for contracts. Do NOT modify it.
- NO adapter layer — frontend aligns directly to backend shapes.
- Comments default behavior is acceptable (new comments require approval; no special moderation UX needed yet).
- `/stories` in the old backend is legacy and can be ignored.

---

## 1) backend Contract Reference

### Article shape (from `backend/json-schemas/canonical-contract.json`)
```
{
  _id: ObjectId,
  title: string,
  slug: string,
  content: string,
  excerpt?: string,
  categoryId: ObjectId (populated -> { _id, name, slug }),
  subcategoryId?: ObjectId (populated),
  tagIds: ObjectId[] (populated -> [{ _id, name, slug }]),
  authors: [{ authorId: ObjectId (populated -> User), order: number }],
  featuredMediaId?: ObjectId (populated -> { _id, url, altText }),
  imageCaption?: string,
  published: boolean,
  publishedAt: Date | null,
  allowComments: boolean,
  isFeatured: boolean,
  isSticky: boolean,
  viewCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Comment shape
```
{
  _id: ObjectId,
  articleId: ObjectId,
  parentCommentId?: ObjectId,
  content: string,
  username: string,
  thumbsUp: number,
  thumbsDown: number,
  approved: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### User shape (for populated authors)
```
{
  _id: ObjectId,
  name: string,
  bio?: string,
  isAdmin: boolean,
  profilePictureMediaId?: ObjectId,
  socialLinks: [{ platform, url }]
}
```

### Media shape
```
{
  _id: ObjectId,
  url: string,
  altText: string
}
```

### Category / Tag shape
```
{
  _id: ObjectId,
  name: string,
  slug: string
}
```

---

## 2) Frontend Type Updates

Update `frontend/src/types/article.ts` to match backend exactly:

### Before (legacy)
- `categories: ArticleReference[]`
- `tags: ArticleTag[]`
- `authors: [{ user, position }]`
- `featuredImage: { id, url, ... }`
- `status: 'draft' | 'published' | ...`

### After (aligned)
- `categoryId: { _id, name, slug } | null`
- `subcategoryId?: { _id, name, slug, categoryId } | null`
- `tagIds: Array<{ _id, name, slug }>`
- `authors: Array<{ authorId: User | string, order: number }>`
- `featuredMediaId: { _id, url, altText } | null`
- `published: boolean`
- `publishedAt: Date | string | null`

### User type (for populated authorId)
```ts
interface User {
  _id: string;
  name: string;
  isAdmin?: boolean;
  profilePictureMediaId?: string;
}
```

### Media type
```ts
interface Media {
  _id: string;
  url: string;
  altText: string;
}
```

---

## 3) Endpoint Mapping

### Articles
| Old route | New route |
|-----------|-----------|
| `GET /articles?status=published` | `GET /articles/published` |
| `GET /articles?isSticky=true` | `GET /articles/sticky` |
| `GET /articles/feed/paginated?offset=X` | `GET /articles/feed?page=X&limit=Y` |
| `GET /articles/category/:id` | `GET /articles/category/:id` (same) |
| `GET /articles/:id` | `GET /articles/:id` (same) |

Feed pagination:
- Switch from offset-based to page-based in `InfiniteScrollModule`.
- `hasMore = page < pagination.pages`

### Categories
| Old | New |
|-----|-----|
| `GET /categories?limit=50` | `GET /categories` (no limit param) |

### Comments
| Old | New |
|-----|-----|
| `GET /comments/article/:id` | `GET /comments/article/:id` (same, but response is wrapped) |
| `POST /comments/article/:id` | `POST /comments` with `{ articleId, content, username }` |
| `PATCH /comments/:id/thumbs` | `PATCH /comments/:id/like` or `/dislike` |

### Slivers
| Old | New |
|-----|-----|
| `POST /slivers { text }` | `POST /slivers { text }` (same) |

---

## 4) Files to Update

### 4.1 Types
- `frontend/src/types/article.ts`
  - Rewrite `ArticleDocument` to use `categoryId`, `tagIds`, `authors[].authorId`, `featuredMediaId`, `published`
  - Remove legacy fields: `categories`, `tags`, `authors[].user`, `featuredImage`, `status`

### 4.2 Mapping utility
- `frontend/src/utils/articleMapping.ts`
  - Update `mapArticleToPost` to read from new field names:
    - `article.categoryId?.name` instead of `article.categories?.[0]?.name`
    - `article.authors?.[0]?.authorId` instead of `article.authors?.[0]?.user`
    - `article.featuredMediaId` instead of `article.featuredImage`

### 4.3 Article page
- `frontend/src/pages/Article.tsx`
  - Read `article.categoryId` instead of `article.categories`
  - Read `article.tagIds` instead of `article.tags`
  - Read `article.authors[].authorId.name` instead of nested user object
  - Read `article.featuredMediaId` instead of `article.featuredImage`
  - For comments: use `comment.username` directly, no `author.name/avatar`

### 4.4 Comment component
- `frontend/src/components/Comment.tsx`
  - Change props from `name, avatar` to `username`
  - Use a default/placeholder avatar

### 4.5 Services
- `frontend/src/services/apiClient.ts` (already created)
  - Shared axios client with `unwrap()` helper

- `frontend/src/services/articleService.ts`
  - Use `apiClient`
  - Update routes: `/articles/published`, `/articles/sticky`, `/articles/feed`, etc.
  - Unwrap responses

- `frontend/src/services/commentService.ts`
  - Use `apiClient`
  - `POST /comments` with `{ articleId, content, username }`
  - Unwrap responses

- `frontend/src/services/sliverService.ts`
  - Use `apiClient`

### 4.6 Infinite scroll
- `frontend/src/components/InfiniteScrollModule.tsx`
  - Change from offset-based to page-based state
  - Use `GET /articles/feed?page=N&limit=M`
  - Compute `hasMore` from `pagination.page < pagination.pages`

### 4.7 Cleanup
- Remove `frontend/src/services/adapters/` directory (not needed)
- Remove or leave `frontend/src/services/storyService.ts` (unused)

---

## 5) Implementation Order

1. Update `frontend/src/types/article.ts`
2. Update `frontend/src/utils/articleMapping.ts`
3. Update `frontend/src/services/articleService.ts`
4. Update `frontend/src/services/commentService.ts`
5. Update `frontend/src/services/sliverService.ts`
6. Update `frontend/src/pages/Article.tsx`
7. Update `frontend/src/components/Comment.tsx`
8. Update `frontend/src/components/InfiniteScrollModule.tsx`
9. Verify build: `cd frontend && npm run build`
10. Manual test against running `backend`

---

## 6) Verification Checklist

Local run:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`

Test flows:
- Home page loads categories + article sections
- Article page shows content, author, category, tags, featured image
- Comments load and display usernames
- New comment submission works
- Infinite scroll loads more articles

---

## 7) Non-Goals / Future Work

- Dashboard migration (separate effort)
- Auth/login (not used by public frontend)
- Voting on comments (UI is commented out; defer)
- `/stories` endpoint (legacy, unused)

# Dashboard -> Backend Migration Plan

**Goal**: Connect `dashboard/` to `backend/` using real data and Google Authentication.

## 1. Infrastructure: API Client

Create `dashboard/src/lib/api-client.ts`:
- **Library**: `axios`
- **Base URL**: `import.meta.env.VITE_API_BASE_URL` (default: `http://localhost:5050/api`)
- **Credentials**: `withCredentials: true` (Critical for auth cookies)
- **Interceptors**: 
  - Unwrap `{ success: true, data: ... }` responses.
  - **Correction**: `GET /auth/me` returns raw user data. The interceptor must return `response.data` if the `success` envelope is missing.

## 2. Authentication: Session Management

The backend uses HttpOnly cookies set via Google OAuth. The dashboard needs to check this session on load.

- **Store**: `dashboard/src/stores/authStore.ts`
  - Remove demo credentials and mock logic.
  - Add `checkAuth()` action calling `GET /auth/me`.
  - Handle 401 (unauthorized) -> redirect to login.
  - Handle 200 (OK) -> hydrate user state.
  - **Mapping**: Backend `User` has `isAdmin`, not `role`. Map `isAdmin: true` -> `['admin']`.

- **App Entry**: `dashboard/src/routes/__root.tsx` (or `main.tsx`)
  - Call `checkAuth()` on mount.

- **Login Page**: `dashboard/src/features/auth/sign-in`
  - Ensure "Sign in with Google" button points to `${API_BASE_URL}/auth/google?redirect=${window.location.origin}/dash`.
  - **Note**: This must be a full page navigation (`<a href>`), not an AJAX call.

## 3. Features: Connect Real Data

### A. Users (`dashboard/src/features/users`)
- **Route**: `GET /users`
- **Data Source**: Replace Faker in `data/users.ts` with `apiClient.get('/users')`.
- **Schema Mapping**:
  - Backend: `_id`, `name`, `isAdmin` (No email, no status)
  - Frontend Table: 
    - `id` <- `_id`
    - `username` <- `name`
    - `role` <- `isAdmin ? 'admin' : 'user'`
    - `status` <- 'active' (placeholder)
    - `email` <- 'N/A' (placeholder)

### B. Articles (`dashboard/src/features/articles`)
- **Route**: `GET /admin/articles` (Admin-specific route)
- **Refactor**: `dashboard/src/features/articles/article-libary/useArticles.ts`
- **Changes**:
  - Replace `fetch` with `apiClient`.
  - Update `transformArticleData` to map:
    - `_id` -> `id`
    - `categoryId` (populated object) -> `category`
    - `tagIds` (populated array) -> `tags`
    - `featuredMediaId` (populated object) -> `featuredMedia`

### C. Categories/Tags
- **Routes**: `GET /categories`, `GET /tags`
- **Usage**: Verify `ArticleDialogs.tsx` (edit forms) uses `apiClient`.

## 4. Cleanup

- Uninstall/Remove usage of `@faker-js/faker`.
- Remove hardcoded "Demo Credentials" from UI.
- **Port Check**: Ensure `dashboard/vite.config.ts` uses port 5173 (or added to backend CORS allowlist).
