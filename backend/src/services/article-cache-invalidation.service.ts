import { CloudflareCacheService } from './cloudflare-cache.service';
import { ArticleCacheSnapshot } from '../utils/cache-tags';
import { env } from '../utils/env';

type PurgeFile = string | { url: string; headers?: Record<string, string> };

type InvalidateParams = {
  before?: ArticleCacheSnapshot | null;
  after?: ArticleCacheSnapshot | null;
  mutationType:
    | 'create'
    | 'update'
    | 'delete'
    | 'publish'
    | 'unpublish'
    | 'feature'
    | 'sticky';
};

const isPublic = (snapshot: ArticleCacheSnapshot | null | undefined) => Boolean(snapshot?.published);

const addIfPresent = (tags: Set<string>, prefix: string, value: string | null | undefined) => {
  if (value) tags.add(`${prefix}:${value}`);
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const parsePurgeOrigins = (): string[] => {
  const configuredOrigins = env.PUBLIC_CACHE_PURGE_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ['https://nique.net', 'https://www.nique.net'];
};

const withOriginVariants = (urls: string[]): PurgeFile[] => {
  const origins = parsePurgeOrigins();
  const files: PurgeFile[] = [...urls];

  for (const url of urls) {
    for (const origin of origins) {
      files.push({
        url,
        headers: {
          Origin: origin,
        },
      });
    }
  }

  return files;
};

const buildDetailUrls = (snapshot: ArticleCacheSnapshot | null | undefined): PurgeFile[] => {
  if (!snapshot || !env.PUBLIC_API_BASE_URL) return [];

  const baseUrl = stripTrailingSlash(env.PUBLIC_API_BASE_URL);
  const urls = [`${baseUrl}/articles/${snapshot.id}`];

  if (snapshot.slug) {
    urls.push(`${baseUrl}/articles/slug/${snapshot.slug}`);
  }

  return withOriginVariants(urls);
};

const buildListUrls = (
  before: ArticleCacheSnapshot | null | undefined,
  after: ArticleCacheSnapshot | null | undefined,
): PurgeFile[] => {
  if (!env.PUBLIC_API_BASE_URL) return [];

  const baseUrl = stripTrailingSlash(env.PUBLIC_API_BASE_URL);
  const categoryIds = new Set<string>(
    [before?.categoryId, after?.categoryId].filter((id): id is string => Boolean(id)),
  );
  const urls = [
    `${baseUrl}/articles/featured`,
    `${baseUrl}/articles/sticky`,
    `${baseUrl}/articles/published`,
    `${baseUrl}/articles/published?limit=5`,
    `${baseUrl}/articles/feed`,
    ...Array.from(categoryIds).map((categoryId) => `${baseUrl}/articles/category/${categoryId}`),
  ];

  return withOriginVariants(urls);
};

export class ArticleCacheInvalidationService {
  static async invalidatePublicArticleCache({ before, after }: InvalidateParams): Promise<void> {
    if (!isPublic(before) && !isPublic(after)) {
      return;
    }

    const current = after ?? before;
    if (!current) return;

    const tags = new Set<string>(['articles', 'articles:published', 'articles:feed']);

    tags.add(`article:${current.id}`);
    addIfPresent(tags, 'article-slug', before?.slug || after?.slug || null);
    addIfPresent(tags, 'category', isPublic(before) ? before?.categoryId : null);
    addIfPresent(tags, 'category', isPublic(after) ? after?.categoryId : null);

    const tagIds = new Set<string>([
      ...(isPublic(before) ? before?.tagIds ?? [] : []),
      ...(isPublic(after) ? after?.tagIds ?? [] : []),
    ]);
    tagIds.forEach((tagId) => addIfPresent(tags, 'tag', tagId));

    const authorIds = new Set<string>([
      ...(isPublic(before) ? before?.authorIds ?? [] : []),
      ...(isPublic(after) ? after?.authorIds ?? [] : []),
    ]);
    authorIds.forEach((authorId) => addIfPresent(tags, 'author', authorId));

    if ((isPublic(before) && before?.isFeatured) || (isPublic(after) && after?.isFeatured)) {
      tags.add('articles:featured');
    }

    if ((isPublic(before) && before?.isSticky) || (isPublic(after) && after?.isSticky)) {
      tags.add('articles:sticky');
    }

    const urls = [
      ...buildDetailUrls(before),
      ...buildDetailUrls(after),
      ...buildListUrls(before, after),
    ];

    await CloudflareCacheService.purgeTags(Array.from(tags));
    await CloudflareCacheService.purgeUrls(urls);
  }
}
