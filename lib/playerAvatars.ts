// Explicit portrait choices shared by local profiles and online seats.
export const PLAYER_AVATARS = [
  { id: 'initials', label: 'Neutral player icon' },
  { id: 'portrait-0', label: 'Long dark hair, coral shirt' },
  { id: 'portrait-1', label: 'Curly red hair, green shirt' },
  { id: 'portrait-2', label: 'Yellow cap, teal shirt' },
  { id: 'portrait-3', label: 'Short curls and beard, yellow shirt' },
  { id: 'portrait-4', label: 'Red glasses, blue shirt' },
  { id: 'portrait-5', label: 'Silver curls, plum shirt' },
  { id: 'portrait-6', label: 'Swept black hair and moustache, blue shirt' },
  { id: 'portrait-7', label: 'Short locs, coral shirt' },
  { id: 'portrait-8', label: 'Blue glasses and freckles, yellow shirt' },
  { id: 'portrait-9', label: 'Silver hair and beard, teal shirt' },
  { id: 'portrait-10', label: 'Natural afro, yellow shirt' },
  { id: 'portrait-11', label: 'High bun and coral glasses, plum shirt' },
] as const;
export type AvatarId = (typeof PLAYER_AVATARS)[number]['id'];
export function isAvatarId(value: unknown): value is AvatarId {
  return PLAYER_AVATARS.some((avatar) => avatar.id === value);
}
const AVATAR_KEY = 'uno.profile.avatar';
const AVATAR_EVENT = 'uno:avatar-updated';
let sessionAvatar: AvatarId = 'initials';
export function getPlayerAvatar(): AvatarId {
  try {
    const saved = localStorage.getItem(AVATAR_KEY);
    return isAvatarId(saved) ? saved : sessionAvatar;
  } catch {
    return sessionAvatar;
  }
}
export function savePlayerAvatar(avatarId: AvatarId): void {
  sessionAvatar = avatarId;
  try {
    localStorage.setItem(AVATAR_KEY, avatarId);
  } catch {
    /* Play without persistence. */
  }
  window.dispatchEvent(new Event(AVATAR_EVENT));
}
export function subscribePlayerAvatar(onChange: () => void): () => void {
  window.addEventListener(AVATAR_EVENT, onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === AVATAR_KEY || event.key === null) {
      sessionAvatar = isAvatarId(event.newValue) ? event.newValue : 'initials';
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(AVATAR_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
