import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import Article from '../src/models/Article';
import Category from '../src/models/Category';
import Tag from '../src/models/Tag';
import User from '../src/models/User';
import { CloudflareCacheService } from '../src/services/cloudflare-cache.service';

const app = createApp();

const generateToken = (payload: { id: string; name: string; isAdmin: boolean }) => {
  return jwt.sign(payload, process.env.JWT_TOKEN || 'test-secret', { expiresIn: '1h' });
};

const adminId = '000000000000000000000001';
const adminToken = generateToken({ id: adminId, name: 'Admin User', isAdmin: true });

const createPublishedArticleFixture = async () => {
  const suffix = new mongoose.Types.ObjectId().toString().slice(-6);
  const ownerId = new mongoose.Types.ObjectId(adminId);
  const category = await Category.create({ name: `Cache Category ${suffix}`, slug: `cache-category-${suffix}` });
  const tag = await Tag.create({ name: `Cache Tag ${suffix}`, slug: `cache-tag-${suffix}` });
  await User.create({ _id: ownerId, name: `Cache Author ${suffix}`, isAdmin: true, socialLinks: [] });

  const article = await Article.create({
    title: `Cache Test ${suffix}`,
    slug: `cache-test-${suffix}`,
    content: '<p>Cacheable article</p>',
    categoryId: category._id,
    tagIds: [tag._id],
    ownerId,
    authors: [{ authorId: ownerId, order: 0 }],
    published: true,
    publishedAt: new Date(),
    allowComments: true,
    isFeatured: true,
    isSticky: true,
    reviewStatus: 'published',
    viewCount: 0,
  });

  return { article, category, tag, ownerId };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Article.deleteMany({ slug: /^cache-test-/ });
  await Category.deleteMany({ slug: /^cache-category-/ });
  await Tag.deleteMany({ slug: /^cache-tag-/ });
  await User.deleteMany({ name: /^Cache Author / });
});

describe('Article cache behavior', () => {
  it('sets cache headers and tags on cacheable article reads without incrementing views', async () => {
    const { article, category, tag, ownerId } = await createPublishedArticleFixture();

    const res = await request(app).get(`/api/articles/${article._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
    expect(res.headers['cloudflare-cdn-cache-control']).toBe(
      'public, max-age=21600, stale-while-revalidate=60, stale-if-error=86400',
    );
    expect(res.headers['cache-tag']).toContain('articles');
    expect(res.headers['cache-tag']).toContain(`article:${article._id.toString()}`);
    expect(res.headers['cache-tag']).toContain(`article-slug:${article.slug}`);
    expect(res.headers['cache-tag']).toContain(`category:${category._id.toString()}`);
    expect(res.headers['cache-tag']).toContain(`tag:${tag._id.toString()}`);
    expect(res.headers['cache-tag']).toContain(`author:${ownerId.toString()}`);
    expect(res.headers['cache-tag']).toContain('articles:featured');
    expect(res.headers['cache-tag']).toContain('articles:sticky');

    const reloaded = await Article.findById(article._id).lean();
    expect(reloaded?.viewCount).toBe(0);
  });

  it('marks search responses as no-store and omits cache tags', async () => {
    await createPublishedArticleFixture();

    const res = await request(app).get('/api/articles/feed?search=cache');

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['cloudflare-cdn-cache-control']).toBe('no-store');
    expect(res.headers['cache-tag']).toBeUndefined();
  });

  it('records article views via the dedicated endpoint', async () => {
    const { article } = await createPublishedArticleFixture();

    const res = await request(app).post(`/api/articles/${article._id.toString()}/view`);

    expect(res.status).toBe(204);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['cloudflare-cdn-cache-control']).toBe('no-store');

    const reloaded = await Article.findById(article._id).lean();
    expect(reloaded?.viewCount).toBe(1);
  });

  it('purges Cloudflare tags after a public article mutation', async () => {
    const { article } = await createPublishedArticleFixture();
    const nextCategory = await Category.create({ name: 'Cache Category Updated', slug: 'cache-category-updated' });
    const nextTag = await Tag.create({ name: 'Cache Tag Updated', slug: 'cache-tag-updated' });

    const purgeSpy = vi.spyOn(CloudflareCacheService, 'purgeTags').mockResolvedValue();
    const purgeUrlsSpy = vi.spyOn(CloudflareCacheService, 'purgeUrls').mockResolvedValue();

    const res = await request(app)
      .put(`/api/admin/articles/${article._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated cache test title',
        categoryId: nextCategory._id.toString(),
        tagIds: [nextTag._id.toString()],
      });

    expect(res.status).toBe(200);
    expect(purgeSpy).toHaveBeenCalledTimes(1);
    expect(purgeUrlsSpy).toHaveBeenCalledTimes(1);

    const purgedTags = purgeSpy.mock.calls[0][0];
    expect(purgedTags).toContain('articles');
    expect(purgedTags).toContain('articles:published');
    expect(purgedTags).toContain('articles:feed');
    expect(purgedTags).toContain(`article:${article._id.toString()}`);
    expect(purgedTags).toContain(`article-slug:${article.slug}`);
    expect(purgedTags).toContain(`category:${article.categoryId.toString()}`);
    expect(purgedTags).toContain(`category:${nextCategory._id.toString()}`);
    expect(purgedTags).toContain('articles:featured');
    expect(purgedTags).toContain('articles:sticky');

    const purgedUrls = purgeUrlsSpy.mock.calls[0][0];
    expect(purgedUrls).toContain(`https://api.nique.net/api/articles/${article._id.toString()}`);
    expect(purgedUrls).toContain(`https://api.nique.net/api/articles/slug/${article.slug}`);
  });
});
