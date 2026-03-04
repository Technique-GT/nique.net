import type { NextFunction, Request, Response } from 'express';

const EDGE_CACHE_CONTROL =
  'public, max-age=21600, stale-while-revalidate=60, stale-if-error=86400';
const NO_STORE = 'no-store';

const setHeaderIfMissing = (res: Response, name: string, value: string) => {
  if (!res.getHeader(name)) {
    res.setHeader(name, value);
  }
};

export const applyNoStoreHeaders = (res: Response) => {
  res.setHeader('Cache-Control', NO_STORE);
  res.setHeader('Cloudflare-CDN-Cache-Control', NO_STORE);
};

export const applyPublicReadCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    next();
    return;
  }

  const search = req.query?.search;
  const hasSearch = typeof search === 'string' && search.trim().length > 0;

  if (hasSearch) {
    applyNoStoreHeaders(res);
    next();
    return;
  }

  setHeaderIfMissing(res, 'Cache-Control', NO_STORE);
  setHeaderIfMissing(res, 'Cloudflare-CDN-Cache-Control', EDGE_CACHE_CONTROL);
  next();
};
