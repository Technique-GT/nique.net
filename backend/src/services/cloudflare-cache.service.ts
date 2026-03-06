import { env } from '../utils/env';
import { logger } from '../utils/logger';

const PURGE_ENDPOINT = (zoneId: string) => `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

type PurgeResponsePayload = { success?: boolean; errors?: unknown[] } | null;
type PurgeFile = string | { url: string; headers?: Record<string, string> };

const purgeCloudflareCache = async (
  body: Record<string, unknown>,
  context: Record<string, unknown>,
  successMessage: string,
  failureMessage: string,
) => {
  if (!env.CLOUDFLARE_ZONE_ID || !env.CLOUDFLARE_API_TOKEN) {
    logger.warn('Cloudflare cache purge skipped because credentials are not configured');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(PURGE_ENDPOINT(env.CLOUDFLARE_ZONE_ID), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as PurgeResponsePayload;

    logger.info(
      { ...context, status: response.status, payload },
      successMessage,
    );

    if (!response.ok || !payload?.success) {
      logger.error(
        { ...context, status: response.status, response: payload },
        failureMessage,
      );
    }
  } catch (error) {
    logger.error({ error, ...context }, `${failureMessage} request failed`);
  } finally {
    clearTimeout(timeout);
  }
};

export class CloudflareCacheService {
  static async purgeTags(tags: string[]): Promise<void> {
    const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
    if (uniqueTags.length === 0) return;

    if (!env.CLOUDFLARE_PURGE_ENABLED) {
      logger.debug({ tags: uniqueTags }, 'Cloudflare cache purge skipped because it is disabled');
      return;
    }

    logger.info({ tags: uniqueTags }, 'Cloudflare purge tags');
    await purgeCloudflareCache(
      { tags: uniqueTags },
      { tags: uniqueTags },
      'Cloudflare purge response',
      'Cloudflare cache purge failed',
    );
  }

  static async purgeUrls(urls: PurgeFile[]): Promise<void> {
    const uniqueUrls = Array.from(
      new Map(
        urls
          .filter((url): url is PurgeFile => {
            if (typeof url === 'string') return Boolean(url);
            return Boolean(url.url);
          })
          .map((url) => [
            typeof url === 'string'
              ? url
              : JSON.stringify({
                  url: url.url,
                  headers: url.headers ?? {},
                }),
            url,
          ]),
      ).values(),
    );

    if (uniqueUrls.length === 0) return;

    if (!env.CLOUDFLARE_PURGE_ENABLED) {
      logger.debug({ urls: uniqueUrls }, 'Cloudflare URL purge skipped because it is disabled');
      return;
    }

    logger.info({ urls: uniqueUrls }, 'Cloudflare purge urls');
    await purgeCloudflareCache(
      { files: uniqueUrls },
      { urls: uniqueUrls },
      'Cloudflare URL purge response',
      'Cloudflare URL purge failed',
    );
  }
}
