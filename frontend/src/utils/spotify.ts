export const toSpotifyEmbedUrl = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]+)$/);
  if (uriMatch) {
    return `https://open.spotify.com/embed/playlist/${uriMatch[1]}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname !== 'open.spotify.com') return null;
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (parts[0] === 'embed' && parts[1] === 'playlist' && parts[2]) {
      return parsed.toString();
    }

    if (parts[0] === 'playlist' && parts[1]) {
      const embedUrl = new URL(`https://open.spotify.com/embed/playlist/${parts[1]}`);
      embedUrl.search = parsed.search;
      return embedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};
