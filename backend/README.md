# TechniqueDash Server

Modern Express + TypeScript backend for the Technique publication platform.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start development server
pnpm run dev
```

The server runs on `http://localhost:5050` by default.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ATLAS_URI` | Yes | - | MongoDB Atlas connection string |
| `MONGO_DB_NAME` | No | `test` | Database name to connect to |
| `PORT` | No | `5050` | Server port |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `JWT_TOKEN` | Yes | - | Alias for `JWT_SECRET` used in Auth Controller |
| `GOOGLE_CLIENT_ID` | Yes | - | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | - | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Yes | - | Google OAuth Redirect URI |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS |
| `NODE_ENV` | No | `development` | Environment mode |

### Safety Constraint

The server **refuses to start** if `MONGO_DB_NAME=technique`. This prevents accidental writes to production data. Use `test` for development.

## Scripts

```bash
# Development
pnpm run dev          # Start with hot reload (tsx watch)

# Build
pnpm run build        # Compile TypeScript to dist/
pnpm run start        # Run compiled output

# Testing
pnpm run test         # Run all tests once
pnpm run test:watch   # Run tests in watch mode
pnpm run test:coverage # Run tests with coverage report

# Linting & Formatting
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Run ESLint with auto-fix
pnpm run format       # Format with Prettier
pnpm run format:check # Check formatting
```

## Project Structure

```
server/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware (auth, validation, errors)
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── schemas/          # Zod validation schemas
│   ├── scripts/          # CLI utilities (see below)
│   ├── utils/            # Helpers (logger, env, etc.)
│   └── index.ts          # Entry point
├── json-schemas/
│   └── canonical-contract.json  # MongoDB validator definitions
├── .env                  # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get current logged-in user (requires JWT) |
| POST | `/api/auth/logout` | Logout (clears cookies) |

### Articles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/articles/feed` | Public feed (paginated, no content) |
| GET | `/api/articles/published` | Published articles list |
| GET | `/api/articles/featured` | Featured articles |
| GET | `/api/articles/sticky` | Sticky articles |
| GET | `/api/articles/slug/:slug` | Single article by slug |
| GET | `/api/articles/:id` | Single article by ID |
| GET | `/api/articles` | All articles (admin) |
| POST | `/api/articles` | Create article |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |
| PATCH | `/api/articles/:id/status` | Update publish status |
| PATCH | `/api/articles/:id/featured` | Toggle featured |
| PATCH | `/api/articles/:id/sticky` | Toggle sticky |

**Feed Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 50)
- `search` - Search in title
- `categoryId` - Filter by category
- `tagId` - Filter by tag
- `authorId` - Filter by author
- `isSticky` - Filter sticky articles

### Admin Articles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/articles` | All articles with drafts |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/comments` | All comments (supports `?articleId=...`) |
| GET | `/api/comments/article/:articleId` | Comments for article |
| GET | `/api/comments/:id` | Single comment |
| POST | `/api/comments` | Create comment |
| PUT | `/api/comments/:id` | Update comment |
| DELETE | `/api/comments/:id` | Delete comment |
| PATCH | `/api/comments/:id/status` | Approve/reject |
| PATCH | `/api/comments/:id/like` | Increment thumbsUp |
| PATCH | `/api/comments/:id/dislike` | Increment thumbsDown |
| GET | `/api/comments/stats` | Comment statistics |

### Slivers

Slivers are short-lived announcements that expire after 30 days.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/slivers` | All slivers |
| GET | `/api/slivers/active` | Non-expired slivers only |
| POST | `/api/slivers` | Create sliver (sets 30-day expiry) |
| DELETE | `/api/slivers/:id` | Delete sliver |

### Categories / Tags / Subcategories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all |
| GET | `/api/tags` | List all |
| GET | `/api/subcategories` | List all |
| POST/PUT/DELETE | `.../:id` | CRUD operations |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Single user |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Media

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/media` | List all media |
| GET | `/api/media/:id` | Single media |
| POST | `/api/media/upload` | Upload media |
| DELETE | `/api/media/:id` | Delete media |

## Database Schema

The canonical MongoDB schema is defined in `json-schemas/canonical-contract.json`. This file contains `$jsonSchema` validators for all collections:

- `articles` - Published content with authors, categories, tags
- `categories` - Content categories (News, Life, Opinion, etc.)
- `subcategories` - Category subdivisions
- `tags` - Content tags
- `users` - Authors and admins
- `comments` - Article comments with moderation
- `media` - Uploaded images/files
- `slivers` - Time-limited announcements

### Key Design Decisions

1. **Articles use `published: boolean`** - No multi-status workflow
2. **Search is title only** - Content search not supported
3. **Slivers expire after 30 days** - Server sets `expiresAt` automatically
4. **Content stored as HTML** - WYSIWYG output, sanitization deferred

## CLI Scripts

### Audit Schema

Validates DB documents against the canonical contract:

```bash
pnpm tsx src/scripts/audit-article-schema.ts
```

Outputs JSON with validation issues and index check results.

### Dump Validators

Extracts `$jsonSchema` validators from MongoDB:

```bash
# Check for drift between DB and contract
pnpm tsx src/scripts/dump-validators.ts --check

# Print current DB validators to stdout
pnpm tsx src/scripts/dump-validators.ts --stdout

# Overwrite contract file with DB validators
pnpm tsx src/scripts/dump-validators.ts --force

# Use a different database
MONGO_DB_NAME=other pnpm tsx src/scripts/dump-validators.ts --stdout
```

### Transform DB

Transforms a document to the canonical format (read-only; no writes):

```bash
pnpm tsx src/scripts/transform-db.ts
```

### Migrate Subcategories

Backfills `subcategoryId` in the target DB (`test` by default) by reading legacy `subcategories: [{ category, value }]` entries from the source DB (`technique` by default).

```bash
# Writes to TARGET_DB_NAME (default: test). Never writes to technique.
pnpm tsx src/scripts/migrate-subcategories.ts

# Dry run
DRY_RUN=true pnpm tsx src/scripts/migrate-subcategories.ts

# Use custom DBs
SOURCE_DB_NAME=technique TARGET_DB_NAME=test pnpm tsx src/scripts/migrate-subcategories.ts
```

## Validation

Request validation uses Zod schemas in `src/schemas/`. The validation middleware:

1. Validates request body/query/params against Zod schemas
2. Rejects invalid requests with structured error responses
3. Allows valid requests to proceed

Example error response:

```json
{
  "success": false,
  "message": "Invalid request",
  "context": {
    "method": "GET",
    "path": "/api/articles/feed?limit=abc",
    "target": "query"
  },
  "errors": [
    "limit: Invalid input: expected number, received NaN"
  ],
  "issues": [
    {
      "path": "limit",
      "message": "Invalid input: expected number, received NaN",
      "code": "invalid_type"
    }
  ]
}
```

## Logging

Uses Pino for structured JSON logging. In development, logs are pretty-printed.

Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

Request logs include:
- Method, URL, query params
- Response status and timing
- Error stack traces (on failure)

## Indexes

The following indexes are defined for performance:

**Articles:**
- `{ slug: 1 }` (unique)
- `{ published: 1, publishedAt: -1 }`
- `{ categoryId: 1, published: 1, publishedAt: -1 }`
- `{ isFeatured: 1, published: 1, publishedAt: -1 }`

**Comments:**
- `{ articleId: 1, createdAt: 1 }`

**Slivers:**
- `{ expiresAt: 1 }` (TTL index, auto-deletes expired docs)

**Categories/Tags:**
- `{ slug: 1 }` (unique)

## Testing

Tests use [Vitest](https://vitest.dev/) with [Supertest](https://github.com/ladjs/supertest) for API testing.

```bash
# Run all tests
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# With coverage report
pnpm test:coverage
```

### Test Structure

```
tests/
├── setup.ts          # DB connection setup/teardown
├── api.test.ts       # API endpoint integration tests
└── schemas.test.ts   # Zod schema unit tests
```

### What's Tested

**API Endpoints (22 tests):**
- Health check
- Articles feed with pagination and filters
- Article by ID and slug
- Categories, tags, users listing
- Slivers (all and active)
- Comments with filtering
- Admin endpoints
- 404 handler

**Zod Schemas (21 tests):**
- Query parameter coercion and defaults
- Required field validation
- Optional field handling
- Invalid input rejection

### Adding Tests

1. Create a new `.test.ts` file in `tests/` or alongside source in `src/`
2. Import from `vitest` and use `describe`/`it`/`expect`
3. For API tests, use `supertest` with the app from `src/app.ts`

Example:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('My Feature', () => {
  it('does something', async () => {
    const res = await request(app).get('/api/my-endpoint');
    expect(res.status).toBe(200);
  });
});
```

## Development Notes

- **Never connect to `technique` database** - Server refuses to start
- **Use `test` database** for all development
- **Run `--check`** periodically to detect schema drift
- **Run tests before pushing** - `pnpm test`
- **ESLint warnings are expected** - Configured to warn, not block
