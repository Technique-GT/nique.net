const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

const isYouTubeVideoId = (value: string): boolean =>
  YOUTUBE_VIDEO_ID_PATTERN.test(value);

const videoIdFromUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const videoId =
      url.hostname.endsWith("youtu.be")
        ? pathParts[0]
        : url.pathname === "/watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live"].includes(pathParts[0] || "")
            ? pathParts[1]
            : null;

    return videoId && isYouTubeVideoId(videoId) ? videoId : null;
  } catch {
    return null;
  }
};

export const parseYouTubeVideoInput = (input: string): string | null => {
  const trimmedInput = input.trim();
  if (!trimmedInput) return null;

  const iframeSource = trimmedInput.match(
    /<iframe\b[^>]*\ssrc\s*=\s*(["'])(.*?)\1/i,
  )?.[2];

  return videoIdFromUrl(iframeSource || trimmedInput);
};
