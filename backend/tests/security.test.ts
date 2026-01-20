import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import RevokedToken from '../src/models/RevokedToken';
import { hashToken } from '../src/utils/security';

const app = createApp();

// Helper to generate test JWT tokens
const generateToken = (payload: { id: string; name: string; isAdmin: boolean }) => {
  return jwt.sign(payload, process.env.JWT_TOKEN || 'test-secret', { expiresIn: '1h' });
};

const adminToken = generateToken({ id: '000000000000000000000001', name: 'Admin User', isAdmin: true });
const userToken = generateToken({ id: '000000000000000000000002', name: 'Regular User', isAdmin: false });

describe('Security: Authorization Boundary Tests', () => {
  
  describe('User Management Routes (Admin-only)', () => {
    it('GET /api/users returns 401 without auth', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('token');
    });

    it('GET /api/users returns 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin');
    });

    it('GET /api/users returns 200 for admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('POST /api/users returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Attacker', isAdmin: true });
      expect(res.status).toBe(401);
    });

    it('POST /api/users returns 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Attacker', isAdmin: true });
      expect(res.status).toBe(403);
    });

    it('DELETE /api/users/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/users/000000000000000000000001');
      expect(res.status).toBe(401);
    });

    it('POST /api/users/bulk-delete returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/users/bulk-delete')
        .send({ ids: ['000000000000000000000001'] });
      expect(res.status).toBe(401);
    });
  });

  describe('Media Routes (Auth required for mutations)', () => {
    it('GET /api/media is public (returns 200)', async () => {
      const res = await request(app).get('/api/media');
      expect(res.status).toBe(200);
    });

    it('POST /api/media/upload returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.from('test'), 'test.txt');
      expect(res.status).toBe(401);
    });

    it('DELETE /api/media/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/media/000000000000000000000001');
      expect(res.status).toBe(401);
    });
  });

  describe('Category Routes (Auth + Admin for mutations)', () => {
    it('GET /api/categories is public', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
    });

    it('POST /api/categories returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Hacked Category' });
      expect(res.status).toBe(401);
    });

    it('POST /api/categories returns 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'User Category' });
      expect(res.status).toBe(403);
    });

    it('DELETE /api/categories/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/categories/000000000000000000000001');
      expect(res.status).toBe(401);
    });

    it('DELETE /api/categories/:id/hard returns 401 without auth', async () => {
      const res = await request(app).delete('/api/categories/000000000000000000000001/hard');
      expect(res.status).toBe(401);
    });
  });

  describe('Tag Routes (Auth + Admin for mutations)', () => {
    it('GET /api/tags is public', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
    });

    it('POST /api/tags returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/tags')
        .send({ name: 'Hacked Tag' });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/tags/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/tags/000000000000000000000001');
      expect(res.status).toBe(401);
    });
  });

  describe('SubCategory Routes (Auth + Admin for mutations)', () => {
    it('GET /api/sub-categories is public', async () => {
      const res = await request(app).get('/api/sub-categories');
      expect(res.status).toBe(200);
    });

    it('POST /api/sub-categories returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/sub-categories')
        .send({ name: 'Hacked SubCategory', categoryId: '000000000000000000000001' });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/sub-categories/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/sub-categories/000000000000000000000001');
      expect(res.status).toBe(401);
    });
  });

  describe('Comment Routes (Split public/admin)', () => {
    it('POST /api/comments is public (for submitting comments)', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({ content: 'Test', articleId: '000000000000000000000001' });
      // Should not be 401 - it's public but may fail for other reasons (article not found)
      expect(res.status).not.toBe(401);
    });

    it('GET /api/comments/by-article is public', async () => {
      const res = await request(app).get('/api/comments/by-article?articleId=000000000000000000000001');
      expect(res.status).toBe(200);
    });

    it('GET /api/comments (admin list) returns 401 without auth', async () => {
      const res = await request(app).get('/api/comments');
      expect(res.status).toBe(401);
    });

    it('GET /api/comments/stats returns 401 without auth', async () => {
      const res = await request(app).get('/api/comments/stats');
      expect(res.status).toBe(401);
    });

    it('PATCH /api/comments/:id/status returns 401 without auth', async () => {
      const res = await request(app)
        .patch('/api/comments/000000000000000000000001/status')
        .send({ approved: true });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/comments/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/comments/000000000000000000000001');
      expect(res.status).toBe(401);
    });

    it('PUT /api/comments/:id returns 401 without auth', async () => {
      const res = await request(app)
        .put('/api/comments/000000000000000000000001')
        .send({ content: 'Modified by attacker' });
      expect(res.status).toBe(401);
    });

    // Public reaction routes should still work
    it('PATCH /api/comments/:id/like is public', async () => {
      const res = await request(app).patch('/api/comments/000000000000000000000001/like');
      // Not 401 - may be 404 if comment doesn't exist
      expect(res.status).not.toBe(401);
    });
  });

  describe('Playlist Routes (Auth + Admin for mutations)', () => {
    it('GET /api/playlists is public', async () => {
      const res = await request(app).get('/api/playlists');
      expect(res.status).toBe(200);
    });

    it('GET /api/playlists/active is public', async () => {
      const res = await request(app).get('/api/playlists/active');
      expect([200, 404]).toContain(res.status); // May not exist
    });

    it('POST /api/playlists returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/playlists')
        .send({ name: 'Hacked Playlist' });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/playlists/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/playlists/000000000000000000000001');
      expect(res.status).toBe(401);
    });

    it('PUT /api/playlists/:id/set-active returns 401 without auth', async () => {
      const res = await request(app).put('/api/playlists/000000000000000000000001/set-active');
      expect(res.status).toBe(401);
    });
  });

  describe('Sliver Routes (Auth + Admin for mutations)', () => {
    it('GET /api/slivers is public', async () => {
      const res = await request(app).get('/api/slivers');
      expect(res.status).toBe(200);
    });

    it('GET /api/slivers/active is public', async () => {
      const res = await request(app).get('/api/slivers/active');
      expect(res.status).toBe(200);
    });

    it('POST /api/slivers returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/slivers')
        .send({ text: 'Hacked Sliver' });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/slivers/:id returns 401 without auth', async () => {
      const res = await request(app).delete('/api/slivers/000000000000000000000001');
      expect(res.status).toBe(401);
    });
  });

  describe('Admin Article Routes (already protected)', () => {
    it('GET /api/admin/articles returns 401 without auth', async () => {
      const res = await request(app).get('/api/admin/articles');
      expect(res.status).toBe(401);
    });

    it('POST /api/admin/articles returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/admin/articles')
        .send({ title: 'Test', content: 'Test', categoryId: '000000000000000000000001' });
      expect(res.status).toBe(401);
    });
  });

  describe('Token Revocation', () => {
    it('rejects requests with revoked tokens', async () => {
      const revokedToken = generateToken({ id: '000000000000000000000003', name: 'Revoked Admin', isAdmin: true });
      const tokenHash = hashToken(revokedToken);

      await RevokedToken.create({
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${revokedToken}`);

      await RevokedToken.deleteOne({ tokenHash });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('revoked');
    });
  });
});

describe('Security: Input Validation Tests', () => {
  describe('ReDoS Prevention', () => {
    it('handles malicious regex in search params safely', async () => {
      const maliciousInput = '(a+)+$';
      const startTime = Date.now();
      
      const res = await request(app).get(`/api/categories?search=${encodeURIComponent(maliciousInput)}`);
      
      const elapsed = Date.now() - startTime;
      // Should complete in under 1 second, not hang
      expect(elapsed).toBeLessThan(1000);
      expect(res.status).toBe(200);
    });

    it('handles special regex chars in article search', async () => {
      const specialChars = '.*+?^${}()|[]\\';
      const res = await request(app).get(`/api/articles/feed?search=${encodeURIComponent(specialChars)}`);
      
      expect(res.status).toBe(200);
    });
  });
});

describe('Security: Header Tests', () => {
  it('includes security headers from helmet', async () => {
    const res = await request(app).get('/api/health');
    
    // Helmet headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

describe('Security: Public Endpoints Remain Accessible', () => {
  it('GET /api/articles/feed is public', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(200);
  });

  it('GET /api/articles/published is public', async () => {
    const res = await request(app).get('/api/articles/published');
    expect(res.status).toBe(200);
  });

  it('GET /api/articles/featured is public', async () => {
    const res = await request(app).get('/api/articles/featured');
    expect(res.status).toBe(200);
  });

  it('GET /api/health is public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
