# Remediation Plan

This plan addresses the critical security vulnerabilities identified in `ISSUES.MD`.

## Phase 1: Critical Authorization Fixes (Immediate) - COMPLETED

### 1.1 Secure User Management
- [x] **Middleware:** Apply `authMiddleware` to all routes in `backend/src/routes/user.routes.ts`.
- [x] **Controller:** All user operations now require admin access via middleware.
- [x] **Read Access:** `getUsers` (list) restricted to admins only.

### 1.2 Secure Media Management
- [x] **Middleware:** Apply `authMiddleware` to `POST /upload` and `DELETE /:id` in `backend/src/routes/media.routes.ts`.

### 1.3 Secure Taxonomy (Categories, Tags, Subcategories)
- [x] **Middleware:** Apply `authMiddleware` + `adminMiddleware` to all mutation routes (POST, PUT, DELETE) in:
    - `category.routes.ts`
    - `tag.routes.ts`
    - `subCategory.routes.ts`
- [x] **Logic:** Only admins can modify taxonomy.

### 1.4 Secure Content Curation (Playlists, Slivers)
- [x] **Middleware:** Apply `authMiddleware` + `adminMiddleware` to all mutation routes in `playlist.routes.ts` and `sliver.routes.ts`.

### 1.5 Secure Comments & Moderation
- [x] **Route Split:** Separate public comment routes (create, read approved) from admin routes.
- [x] **Middleware:** Apply `authMiddleware` + `adminMiddleware` to `getAllComments` (admin list), `updateCommentStatus`, `deleteComment`.
- [x] **Logic:** Public can create comments and use reactions; admins can moderate.

---

## Phase 2: Security Hardening (High Priority) - COMPLETED

### 2.1 Rate Limiting
- [x] **Global:** Configure `express-rate-limit` in `app.ts` for all API routes (100 req/15min).
- [x] **Auth:** Stricter limits for `/api/auth/*` (10 req/min).
- [x] **Write:** Stricter limits for comment creation and media uploads (20 req/min).

### 2.2 Input Sanitization & Safety
- [x] **XSS:** Implement `sanitizeHtml` for article content and `stripHtml` for comments/usernames.
- [x] **ReDoS:** Created `escapeRegex` and `safeRegex` utilities; applied to all search endpoints.

### 2.3 HTTP Security Headers
- [x] **Helmet:** Initialize `helmet` middleware in `app.ts` with CSP, X-Frame-Options, etc.

---

## Phase 3: Data Integrity & Configuration (Medium Priority)

### 3.1 File Uploads
- [ ] **Validation:** Implement magic-byte detection for file uploads (replace simple mimetype check).

### 3.2 Data Exposure
- [x] **User List:** `getUsers` now requires admin authentication.

### 3.3 Auth Logic
- [x] **Registration:** OAuth flow correctly handles admin status via allowlist.
- [ ] **CORS:** Review and tighten allowed origins based on environment.
- [ ] **Token Revocation:** Consider implementing token revocation strategy.

---

## Files Modified

### New Files Created
- `backend/src/middleware/admin.middleware.ts` - Admin role check middleware
- `backend/src/utils/security.ts` - Security utilities (regex escape, XSS sanitization)
- `backend/tests/security.test.ts` - Comprehensive security tests (47 tests)

### Routes Secured
- `backend/src/routes/user.routes.ts` - Full auth + admin protection
- `backend/src/routes/media.routes.ts` - Auth for upload/delete
- `backend/src/routes/category.routes.ts` - Auth + admin for mutations
- `backend/src/routes/tag.routes.ts` - Auth + admin for mutations
- `backend/src/routes/subCategory.routes.ts` - Auth + admin for mutations
- `backend/src/routes/comment.routes.ts` - Split public/admin routes
- `backend/src/routes/playlist.routes.ts` - Auth + admin for mutations
- `backend/src/routes/sliver.routes.ts` - Auth + admin for mutations

### Controllers Updated (ReDoS + XSS fixes)
- `backend/src/controllers/article.controller.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/controllers/category.controller.ts`
- `backend/src/controllers/tag.controller.ts`
- `backend/src/controllers/subCategory.controller.ts`
- `backend/src/controllers/media.controller.ts`
- `backend/src/controllers/sliver.controller.ts`
- `backend/src/controllers/comment.controller.ts`

### App Configuration
- `backend/src/app.ts` - Added helmet, rate limiting

---

## Test Coverage

All 91 tests pass, including:
- 47 new security tests covering authorization boundaries
- ReDoS prevention tests
- Security header verification
- Public endpoint accessibility verification
