const SESSION_KEY = 'nique-media-revalidate-v1';
const REVALIDATE_PARAM = '__mv';

const createSessionToken = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const getSessionToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const created = createSessionToken();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
};

export const withMediaSessionRevalidation = (rawUrl: string, overrideToken?: string): string => {
  if (!rawUrl) return rawUrl;

  const token = overrideToken || getSessionToken();
  if (!token) return rawUrl;

  const isAbsoluteHttp = /^https?:\/\//i.test(rawUrl);

  try {
    const parsed = typeof window !== 'undefined'
      ? new URL(rawUrl, window.location.origin)
      : new URL(rawUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return rawUrl;
    }

    parsed.searchParams.set(REVALIDATE_PARAM, token);

    if (isAbsoluteHttp) {
      return parsed.toString();
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return rawUrl;
  }
};
