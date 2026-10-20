// Public visitors need a reachable host; local addresses belong only to previews.
export const ONLINE_UNAVAILABLE_MESSAGE =
  'Online tables are unavailable right now. You can still play with bots.';

function isLocalHost(hostname: string): boolean {
  return (
    ['localhost', '[::1]', '0.0.0.0'].includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
  );
}

export function resolveSocketEndpoint(
  configured: string | undefined,
  location: { protocol: string; hostname: string; port: string },
  development = false,
): string | null {
  const localPreview = development || isLocalHost(location.hostname);
  const endpoint = configured?.trim();
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) &&
        (localPreview || !isLocalHost(url.hostname))
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }
  return localPreview
    ? `${location.protocol}//${location.hostname}:3001`
    : null;
}
