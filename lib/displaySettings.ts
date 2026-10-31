// Device-local display preferences supplement the operating system settings.
export const REDUCED_MOTION_KEY = 'uno.settings.reducedMotion';
export const CARD_STYLE_KEY = 'uno.settings.cardStyle';
export type CardStyle = 'swiss' | 'nordic';
let fallback: boolean | null = null;
let cardStyleFallback: CardStyle | null = null;
export function getCardStyleSetting(): CardStyle {
  if (cardStyleFallback !== null) return cardStyleFallback;
  try {
    return localStorage.getItem(CARD_STYLE_KEY) === 'nordic'
      ? 'nordic'
      : 'swiss';
  } catch {
    return 'swiss';
  }
}
export function setCardStyleSetting(value: CardStyle): void {
  try {
    localStorage.setItem(CARD_STYLE_KEY, value);
    cardStyleFallback = null;
  } catch {
    cardStyleFallback = value;
  }
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event('uno:display-settings'));
}
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
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === REDUCED_MOTION_KEY ||
      event.key === CARD_STYLE_KEY ||
      event.key === null
    ) {
      if (event.key === REDUCED_MOTION_KEY || event.key === null)
        fallback = null;
      if (event.key === CARD_STYLE_KEY || event.key === null)
        cardStyleFallback = null;
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
