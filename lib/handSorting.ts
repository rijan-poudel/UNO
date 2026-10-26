// Device-local display order. The authoritative hand and draw order stay intact.
import type { Card, CardColor } from '../types/card';

export type HandSort = 'color' | 'number' | 'original';
const HAND_SORT_KEY = 'uno.hand.sort';
const COLORS: Record<CardColor, number> = {
  red: 0,
  yellow: 1,
  green: 2,
  blue: 3,
  wild: 4,
};

export function getHandSort(): HandSort {
  try {
    const value = localStorage.getItem(HAND_SORT_KEY);
    return value === 'number' || value === 'original' ? value : 'color';
  } catch {
    return 'color';
  }
}

export function saveHandSort(value: HandSort): void {
  try {
    localStorage.setItem(HAND_SORT_KEY, value);
  } catch {
    /* Sorting still works for this round. */
  }
}

export function sortHand(cards: readonly Card[], order: HandSort): Card[] {
  if (order === 'original') return [...cards];
  return [...cards].sort((a, b) => {
    const color = COLORS[a.color] - COLORS[b.color];
    const value = a.value.localeCompare(b.value, undefined, { numeric: true });
    return order === 'number' ? value || color : color || value;
  });
}
