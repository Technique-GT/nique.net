import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

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
  it('GET /api/categories returns all categories', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Tags Endpoints', () => {
  it('GET /api/tags returns all tags', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Users Endpoints', () => {
  it('GET /api/users returns all users', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/users/:id returns 400 for invalid id', async () => {
    const res = await request(app).get('/api/users/invalid');

    expect(res.status).toBe(400);
  });
});

describe('Slivers Endpoints', () => {
  it('GET /api/slivers returns all slivers', async () => {
    const res = await request(app).get('/api/slivers');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.count).toBeDefined();
  });

  it('GET /api/slivers/active returns only active slivers', async () => {
    const res = await request(app).get('/api/slivers/active');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Comments Endpoints', () => {
  describe('GET /api/comments', () => {
    it('returns all comments', async () => {
      const res = await request(app).get('/api/comments');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });

    it('filters by articleId', async () => {
      const res = await request(app).get('/api/comments?articleId=000000000000000000000000');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('rejects invalid articleId', async () => {
      const res = await request(app).get('/api/comments?articleId=invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/comments', () => {
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
  it('GET /api/admin/articles returns all articles including drafts', async () => {
    const res = await request(app).get('/api/admin/articles?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
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
