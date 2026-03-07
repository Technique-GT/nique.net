import { CloudflareCacheService } from './cloudflare-cache.service';
import { ArticleCacheSnapshot } from '../utils/cache-tags';

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

export class ArticleCacheInvalidationService {
  static async invalidatePublicArticleCache(_params: InvalidateParams): Promise<void> {
    await CloudflareCacheService.purgeEverything();
  }
}
