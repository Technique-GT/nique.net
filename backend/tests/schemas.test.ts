import { describe, it, expect } from 'vitest';
import { feedQuerySchema } from '../src/schemas/article.feed.schema';
import { listArticlesQuerySchema, publishedArticlesQuerySchema } from '../src/schemas/article.query.schema';
import { createArticleBodySchema, updateArticleBodySchema } from '../src/schemas/article.mutate.schema';
import { listCommentsQuerySchema } from '../src/schemas/comment.admin.query.schema';
import { createCommentBodySchema } from '../src/schemas/comment.schema';

describe('Zod Schemas', () => {
  describe('feedQuerySchema', () => {
    it('accepts valid query params', () => {
      const result = feedQuerySchema.safeParse({
        page: '1',
        limit: '20',
        search: 'test',
        categoryId: '65f0a305095c8b6a0b100004',
      });

      expect(result.success).toBe(true);
    });

    it('coerces string numbers to numbers', () => {
      const result = feedQuerySchema.safeParse({ page: '5', limit: '10' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(10);
      }
    });

    it('applies defaults when params missing', () => {
      const result = feedQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('rejects invalid page', () => {
      const result = feedQuerySchema.safeParse({ page: 'abc' });

      expect(result.success).toBe(false);
    });

    it('rejects page less than 1', () => {
      const result = feedQuerySchema.safeParse({ page: '0' });

      expect(result.success).toBe(false);
    });

    it('rejects limit greater than max', () => {
      const result = feedQuerySchema.safeParse({ limit: '100' });

      expect(result.success).toBe(false);
    });
  });

  describe('listArticlesQuerySchema', () => {
    it('accepts valid query', () => {
      const result = listArticlesQuerySchema.safeParse({
        page: '1',
        limit: '20',
        search: 'hello',
      });

      expect(result.success).toBe(true);
    });

    it('accepts empty query', () => {
      const result = listArticlesQuerySchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });

  describe('publishedArticlesQuerySchema', () => {
    it('accepts valid query', () => {
      const result = publishedArticlesQuerySchema.safeParse({
        page: '2',
        limit: '15',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('createArticleBodySchema', () => {
    it('accepts valid article body', () => {
      const result = createArticleBodySchema.safeParse({
        title: 'Test Article',
        content: '<p>Test content</p>',
        categoryId: '65f0a305095c8b6a0b100004',
      });

      expect(result.success).toBe(true);
    });

    it('rejects missing title', () => {
      const result = createArticleBodySchema.safeParse({
        content: '<p>Test content</p>',
        categoryId: '65f0a305095c8b6a0b100004',
      });

      expect(result.success).toBe(false);
    });

    it('rejects empty title', () => {
      const result = createArticleBodySchema.safeParse({
        title: '',
        content: '<p>Test content</p>',
        categoryId: '65f0a305095c8b6a0b100004',
      });

      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const result = createArticleBodySchema.safeParse({
        title: 'Test Article',
        content: '<p>Test content</p>',
        categoryId: '65f0a305095c8b6a0b100004',
        excerpt: 'A short excerpt',
        tagIds: ['65f0a305095c8b6a0b100001', '65f0a305095c8b6a0b100002'],
        published: true,
        isFeatured: false,
        isSticky: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateArticleBodySchema', () => {
    it('accepts partial updates', () => {
      const result = updateArticleBodySchema.safeParse({
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
    });

    it('accepts empty body', () => {
      const result = updateArticleBodySchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });

  describe('listCommentsQuerySchema', () => {
    it('accepts valid query', () => {
      const result = listCommentsQuerySchema.safeParse({
        page: '1',
        limit: '50',
        approved: 'true',
      });

      expect(result.success).toBe(true);
    });

    it('accepts articleId filter', () => {
      const result = listCommentsQuerySchema.safeParse({
        articleId: '65f0a305095c8b6a0b100004',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid approved value', () => {
      const result = listCommentsQuerySchema.safeParse({
        approved: 'yes',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('createCommentBodySchema', () => {
    it('accepts valid comment', () => {
      const result = createCommentBodySchema.safeParse({
        articleId: '65f0a305095c8b6a0b100004',
        content: 'This is a comment',
        username: 'TestUser',
      });

      expect(result.success).toBe(true);
    });

    it('rejects missing content', () => {
      const result = createCommentBodySchema.safeParse({
        articleId: '65f0a305095c8b6a0b100004',
        username: 'TestUser',
      });

      expect(result.success).toBe(false);
    });

    it('rejects missing articleId', () => {
      const result = createCommentBodySchema.safeParse({
        content: 'This is a comment',
        username: 'TestUser',
      });

      expect(result.success).toBe(false);
    });
  });
});
