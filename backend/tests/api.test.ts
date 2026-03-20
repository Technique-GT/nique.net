import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import User from '../src/models/User';

const app = createApp();

// Helper to generate test JWT tokens
const generateToken = (payload: { id: string; name: string; isAdmin: boolean }) => {
  return jwt.sign(payload, process.env.JWT_TOKEN || 'test-secret', { expiresIn: '1h' });
};

const adminToken = generateToken({ id: '000000000000000000000001', name: 'Admin User', isAdmin: true });

describe('Health Endpoint', () => {
  it('GET /api/health returns success', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Server is running');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Articles Endpoints', () => {
  describe('GET /api/articles/feed', () => {
    it('returns paginated articles', async () => {
      const res = await request(app).get('/api/articles/feed?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBeDefined();
    });

    it('filters by categoryId', async () => {
      const res = await request(app).get('/api/articles/feed?categoryId=65f0a305095c8b6a0b100004');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid limit', async () => {
      const res = await request(app).get('/api/articles/feed?limit=abc');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects negative page', async () => {
      const res = await request(app).get('/api/articles/feed?page=-1');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/articles/published', () => {
    it('returns published articles only', async () => {
      const res = await request(app).get('/api/articles/published?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('returns 400 for invalid ObjectId', async () => {
      const res = await request(app).get('/api/articles/invalid-id');

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent article', async () => {
      const res = await request(app).get('/api/articles/000000000000000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles/slug/:slug', () => {
    it('returns 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/articles/slug/non-existent-slug-12345');

      expect(res.status).toBe(404);
    });
  });
});

describe('Categories Endpoints', () => {
  it('GET /api/categories returns all categories (public)', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Tags Endpoints', () => {
  it('GET /api/tags returns all tags (public)', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Users Endpoints', () => {
  it('GET /api/users requires authentication', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });

  it('GET /api/users returns data for admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/users/:id requires authentication', async () => {
    const res = await request(app).get('/api/users/000000000000000000000001');

    expect(res.status).toBe(401);
  });
});

describe('Authors Endpoints', () => {
  it('GET /api/authors/:authorName returns public author fields', async () => {
    const uniqueAuthorName = `Author API Test ${Date.now()}`;
    await User.create({
      name: uniqueAuthorName,
      bio: 'A short test bio',
      isAdmin: false,
      email: `author-api-${Date.now()}@example.com`,
      googleSub: `author-api-sub-${Date.now()}`,
      profilePictureUrl: 'https://example.com/avatar.png',
      socialLinks: [{ platform: 'x', url: 'https://x.com/author' }],
    });

    const res = await request(app).get(`/api/authors/${encodeURIComponent(uniqueAuthorName)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe(uniqueAuthorName);
    expect(res.body.data.bio).toBe('A short test bio');
    expect(res.body.data.profilePictureUrl).toBe('https://example.com/avatar.png');
    expect(Array.isArray(res.body.data.socialLinks)).toBe(true);

    // Sensitive fields should not be exposed
    expect(res.body.data.email).toBeUndefined();
    expect(res.body.data.googleSub).toBeUndefined();
    expect(res.body.data.isAdmin).toBeUndefined();
  });

  it('GET /api/authors/:authorName returns 404 for unknown author', async () => {
    const res = await request(app).get(`/api/authors/${encodeURIComponent(`missing-author-${Date.now()}`)}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Slivers Endpoints', () => {
  it('GET /api/slivers returns all slivers (public)', async () => {
    const res = await request(app).get('/api/slivers');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.count).toBeDefined();
  });

  it('GET /api/slivers/active returns only active slivers (public)', async () => {
    const res = await request(app).get('/api/slivers/active');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Comments Endpoints', () => {
  describe('GET /api/comments (admin)', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/comments');

      expect(res.status).toBe(401);
    });

    it('returns comments for admin', async () => {
      const res = await request(app)
        .get('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/comments/by-article (public)', () => {
    it('returns comments for article', async () => {
      const res = await request(app).get('/api/comments/by-article?articleId=000000000000000000000000');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/comments (public)', () => {
    it('rejects empty content', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({ articleId: '000000000000000000000000', content: '' });

      expect(res.status).toBe(400);
    });

    it('rejects missing articleId', async () => {
      const res = await request(app).post('/api/comments').send({ content: 'Test comment' });

      expect(res.status).toBe(400);
    });
  });
});

describe('Admin Endpoints', () => {
  it('GET /api/admin/articles returns 401 when unauthorized', async () => {
    const res = await request(app).get('/api/admin/articles?limit=5');
    expect(res.status).toBe(401);
  });
});

describe('404 Handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});
