// Compact, versioned avatar recipes. The same validation runs on client and server.
export const AVATAR_OPTIONS = {
  face: ['Soft', 'Round', 'Angular'],
  hair: ['Cropped', 'Side part', 'Curls', 'Long', 'Bun', 'Afro', 'Shaved'],
  eyes: ['Open', 'Relaxed', 'Happy'],
  brows: ['Natural', 'Arched', 'Straight'],
  mouth: ['Smile', 'Grin', 'Calm'],
  glasses: ['None', 'Round', 'Square'],
  beard: ['None', 'Moustache', 'Full beard'],
} as const;
export type AvatarFeature = keyof typeof AVATAR_OPTIONS;
export type AvatarColor =
  'skin' | 'hairColor' | 'eyeColor' | 'shirt' | 'background' | 'accessory';
export type CustomAvatar = Record<AvatarFeature, number> &
  Record<AvatarColor, string>;
export const DEFAULT_CUSTOM_AVATAR: CustomAvatar = {
  face: 0,
  hair: 1,
  eyes: 0,
  brows: 0,
  mouth: 0,
  glasses: 0,
  beard: 0,
  skin: '#dca078',
  hairColor: '#302634',
  eyeColor: '#293e5b',
  shirt: '#df3555',
  background: '#c7def4',
  accessory: '#17345f',
};
const FEATURES = Object.keys(AVATAR_OPTIONS) as AvatarFeature[];
const COLORS: AvatarColor[] = [
  'skin',
  'hairColor',
  'eyeColor',
  'shirt',
  'background',
  'accessory',
];
export function parseCustomAvatar(value: unknown): CustomAvatar | null {
  if (typeof value !== 'string' || value.length > 100) return null;
  const parts = value.split('-');
  if (
    parts.shift() !== 'custom' ||
    parts.shift() !== 'v1' ||
    parts.length !== FEATURES.length + COLORS.length
  )
    return null;
  const config = { ...DEFAULT_CUSTOM_AVATAR };
  for (const [index, key] of FEATURES.entries()) {
    const raw = parts[index];
    if (!/^[0-9]$/.test(raw) || Number(raw) >= AVATAR_OPTIONS[key].length)
      return null;
    config[key] = Number(raw);
  }
  for (const [index, key] of COLORS.entries()) {
    const raw = parts[FEATURES.length + index];
    if (!/^[0-9a-f]{6}$/.test(raw)) return null;
    config[key] = `#${raw}`;
  }
  return config;
}
export function customAvatarId(config: CustomAvatar): `custom-${string}` {
  const id =
    `custom-v1-${FEATURES.map((key) => config[key]).join('-')}-${COLORS.map((key) => config[key].slice(1).toLowerCase()).join('-')}` as const;
  if (!parseCustomAvatar(id))
    throw new Error('Choose valid avatar styles and colors.');
  return id;
}
