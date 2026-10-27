// A device-local motion preference supplements the operating system setting.
export const REDUCED_MOTION_KEY = 'uno.settings.reducedMotion';
let fallback: boolean | null = null;
export function getReducedMotionSetting(): boolean {
  if (fallback !== null) return fallback;
  try {
    return localStorage.getItem(REDUCED_MOTION_KEY) === 'true';
  } catch {
    return false;
  }
}
export function setReducedMotionSetting(value: boolean): void {
  try {
    localStorage.setItem(REDUCED_MOTION_KEY, String(value));
    fallback = null;
  } catch {
    fallback = value;
  }
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event('uno:display-settings'));
}
export function subscribeDisplaySettings(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === REDUCED_MOTION_KEY || event.key === null) {
      fallback = null;
      listener();
    }
  };
  window.addEventListener('uno:display-settings', listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('uno:display-settings', listener);
    window.removeEventListener('storage', onStorage);
  };
}
export function isReducedMotion(): boolean {
  return (
    getReducedMotionSetting() ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  );
}
