import { env } from '../utils/env';
import { logger } from '../utils/logger';

const PURGE_ENDPOINT = (zoneId: string) =>
  `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

export class CloudflareCacheService {
  static async purgeTags(tags: string[]): Promise<void> {
    const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
    if (uniqueTags.length === 0) return;

    if (!env.CLOUDFLARE_PURGE_ENABLED) {
      logger.debug({ tags: uniqueTags }, 'Cloudflare cache purge skipped because it is disabled');
      return;
    }

    if (!env.CLOUDFLARE_ZONE_ID || !env.CLOUDFLARE_API_TOKEN) {
      logger.warn('Cloudflare cache purge skipped because credentials are not configured');
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      logger.info({ tags: uniqueTags }, 'Cloudflare purge tags');

      const response = await fetch(PURGE_ENDPOINT(env.CLOUDFLARE_ZONE_ID), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: uniqueTags }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; errors?: unknown[] }
        | null;

      logger.info(
        { status: response.status, payload },
        'Cloudflare purge response',
      );

      if (!response.ok || !payload?.success) {
        logger.error(
          { status: response.status, tags: uniqueTags, response: payload },
          'Cloudflare cache purge failed',
        );
      }
    } catch (error) {
      logger.error({ error, tags: uniqueTags }, 'Cloudflare cache purge request failed');
    } finally {
      clearTimeout(timeout);
    }
  }
}
