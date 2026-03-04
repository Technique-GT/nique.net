import { CloudflareCacheService } from './cloudflare-cache.service';
import { ArticleCacheSnapshot } from '../utils/cache-tags';
import { env } from '../utils/env';

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

const buildDetailUrls = (snapshot: ArticleCacheSnapshot | null | undefined): string[] => {
  if (!snapshot || !env.PUBLIC_API_BASE_URL) return [];

  const baseUrl = stripTrailingSlash(env.PUBLIC_API_BASE_URL);
  const urls = [`${baseUrl}/articles/${snapshot.id}`];

  if (snapshot.slug) {
    urls.push(`${baseUrl}/articles/slug/${snapshot.slug}`);
  }

  return urls;
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

    const urls = new Set<string>([
      ...buildDetailUrls(before),
      ...buildDetailUrls(after),
    ]);

    await CloudflareCacheService.purgeTags(Array.from(tags));
    await CloudflareCacheService.purgeUrls(Array.from(urls));
  }
}
