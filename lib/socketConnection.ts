// Development can use a neighboring port; public deployments need an explicit host.
export const ONLINE_UNAVAILABLE_MESSAGE =
  'Online tables are unavailable right now. You can still play with bots.';
export function resolveSocketEndpoint(
  configured: string | undefined,
  location: { protocol: string; hostname: string; port: string },
  development = false,
): string | null {
  const endpoint = configured?.trim();
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }
  const localPreview =
    development ||
    ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ||
    location.port === '3000';
  return localPreview
    ? `${location.protocol}//${location.hostname}:3001`
    : null;
}
