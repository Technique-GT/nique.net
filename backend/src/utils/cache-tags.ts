import type { Response } from 'express';
import type { IArticle } from '../models/Article';

type IdLike = string | { _id?: string | { toString(): string } } | { toString(): string } | null | undefined;

type RouteContext = {
  routeTag?: string;
  categoryId?: string | undefined;
  tagId?: string | undefined;
  authorId?: string | undefined;
};

const toStringId = (value: IdLike): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in value && value._id && value._id !== value) {
    return toStringId(value._id as IdLike);
  }
  if (typeof (value as { toString?: () => string }).toString === 'function') {
    const stringValue = (value as { toString: () => string }).toString();
    return stringValue && stringValue !== '[object Object]' ? stringValue : null;
  }
  return null;
};

const addIfPresent = (tags: Set<string>, prefix: string, value: string | null | undefined) => {
  if (value) tags.add(`${prefix}:${value}`);
};

export const articleCacheSnapshotFromDoc = (article: Partial<IArticle> | null | undefined) => {
  if (!article) return null;

  const id = toStringId((article as any)._id);
  if (!id) return null;

  const authors = Array.isArray((article as any).authors) ? (article as any).authors : [];
  const tagIds = Array.isArray((article as any).tagIds) ? (article as any).tagIds : [];

  return {
    id,
    slug: typeof (article as any).slug === 'string' ? (article as any).slug : '',
    published: Boolean((article as any).published),
    categoryId: toStringId((article as any).categoryId),
    tagIds: tagIds.map((tag: any) => toStringId(tag)).filter((tagId: string | null): tagId is string => Boolean(tagId)),
    authorIds: authors
      .map((author: any) => toStringId(author?.authorId))
      .filter((authorId: string | null): authorId is string => Boolean(authorId)),
    isFeatured: Boolean((article as any).isFeatured),
    isSticky: Boolean((article as any).isSticky),
  };
};

export type ArticleCacheSnapshot = NonNullable<ReturnType<typeof articleCacheSnapshotFromDoc>>;

const addArticleTags = (tags: Set<string>, article: Partial<IArticle>) => {
  const snapshot = articleCacheSnapshotFromDoc(article);
  if (!snapshot) return;

  tags.add('articles');
  tags.add(`article:${snapshot.id}`);
  addIfPresent(tags, 'article-slug', snapshot.slug || null);
  addIfPresent(tags, 'category', snapshot.categoryId);
  snapshot.tagIds.forEach((tagId: string) => addIfPresent(tags, 'tag', tagId));
  snapshot.authorIds.forEach((authorId: string) => addIfPresent(tags, 'author', authorId));

  if (snapshot.isFeatured) tags.add('articles:featured');
  if (snapshot.isSticky) tags.add('articles:sticky');
};

export const buildDetailCacheTags = (article: Partial<IArticle>) => {
  const tags = new Set<string>();
  addArticleTags(tags, article);
  return Array.from(tags);
};

export const buildListCacheTags = (articles: Partial<IArticle>[], context: RouteContext = {}) => {
  const tags = new Set<string>(['articles']);

  if (context.routeTag) tags.add(context.routeTag);
  addIfPresent(tags, 'category', context.categoryId ?? null);
  addIfPresent(tags, 'tag', context.tagId ?? null);
  addIfPresent(tags, 'author', context.authorId ?? null);

  articles.forEach((article) => addArticleTags(tags, article));

  return Array.from(tags);
};

export const setCacheTags = (res: Response, tags: string[]) => {
  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  if (uniqueTags.length === 0) return;
  res.setHeader('Cache-Tag', uniqueTags.join(','));
};
