/**
 * Lightweight in-browser beeps for game feedback (no audio files).
 * Separate from the arcade voice in /public/voice/.
 */

import { getAudioSettings } from './audioSettings';

export type TableChime =
  | 'cardPlay'
  | 'draw'
  | 'draw2'
  | 'wild4'
  | 'shuffleMotion'
  | 'skip'
  | 'reverse'
  | 'wild'
  | 'shuffle'
  | 'uno'
  | 'callOut'
  | 'deal'
  | 'win'
  | 'lose';

const GAIN: Partial<Record<TableChime, number>> = {
  cardPlay: 0.9,
  draw: 0.85,
  draw2: 0.9,
  wild4: 0.85,
  shuffleMotion: 1,
  skip: 0.9,
  reverse: 0.9,
  wild: 0.88,
  shuffle: 0.86,
  uno: 0.9,
  callOut: 0.9,
  deal: 1,
  win: 0.88,
  lose: 0.82,
};

let ctxRef: AudioContext | null = null;
let lastShuffleMotionAt = 0;

/** Call from a pointer/click on the game so browsers unlock AudioContext. */
export function primeTableAudioFromUserGesture(): void {
  void getCtx()?.resume();
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctxRef) ctxRef = new AC();
  if (ctxRef.state === 'suspended') void ctxRef.resume();
  return ctxRef;
}

function playTone(
  ctx: AudioContext,
  at: number,
  freq: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  gainScale: number,
  slideTo?: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, at + duration);
  }
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(gainPeak * gainScale, at + Math.min(0.02, duration * 0.4));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.01);
}

/** Card motion / shuffle micro-chime; rate-limited. */
export function playShuffleMotionChime(): void {
  if (!getAudioSettings().chimesEnabled) return;
  const now = Date.now();
  if (now - lastShuffleMotionAt < 120) return;
  lastShuffleMotionAt = now;
  playTableChime('shuffleMotion');
}

export function playTableChime(event: TableChime): void {
  if (typeof window === 'undefined') return;
  const settings = getAudioSettings();
  if (!settings.chimesEnabled) return;

  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    /** Keep synthetic beeps faint while arcade voice is on so clips are audible. */
    const duck = settings.voiceInGame ? 0.08 : 1;
    const gainScale = (GAIN[event] ?? 0.85) * duck;

    switch (event) {
      case 'cardPlay':
        playTone(ctx, now, 420, 0.08, 'triangle', 0.024, gainScale, 360);
        break;
      case 'draw':
        playTone(ctx, now, 270, 0.09, 'sine', 0.02, gainScale, 210);
        break;
      case 'draw2':
        playTone(ctx, now, 290, 0.08, 'square', 0.02, gainScale, 240);
        playTone(ctx, now + 0.08, 240, 0.08, 'square', 0.02, gainScale, 190);
        break;
      case 'wild4':
        playTone(ctx, now, 360, 0.1, 'sawtooth', 0.02, gainScale, 220);
        playTone(ctx, now + 0.11, 220, 0.12, 'sawtooth', 0.022, gainScale, 150);
        break;
      case 'shuffleMotion':
        playTone(ctx, now, 330, 0.055, 'sawtooth', 0.028, gainScale, 270);
        playTone(ctx, now + 0.045, 260, 0.055, 'sawtooth', 0.028, gainScale, 320);
        playTone(ctx, now + 0.09, 360, 0.06, 'triangle', 0.022, gainScale, 290);
        break;
      case 'skip':
        playTone(ctx, now, 640, 0.07, 'square', 0.02, gainScale);
        playTone(ctx, now + 0.08, 520, 0.07, 'square', 0.018, gainScale);
        break;
      case 'reverse':
        playTone(ctx, now, 260, 0.09, 'triangle', 0.02, gainScale, 480);
        playTone(ctx, now + 0.09, 480, 0.08, 'triangle', 0.018, gainScale, 300);
        break;
      case 'wild':
        playTone(ctx, now, 320, 0.08, 'sine', 0.018, gainScale, 520);
        playTone(ctx, now + 0.09, 560, 0.09, 'triangle', 0.018, gainScale, 700);
        break;
      case 'shuffle':
        playTone(ctx, now, 280, 0.07, 'sawtooth', 0.016, gainScale, 460);
        playTone(ctx, now + 0.07, 360, 0.07, 'sawtooth', 0.016, gainScale, 240);
        playTone(ctx, now + 0.14, 300, 0.08, 'triangle', 0.018, gainScale, 520);
        break;
      case 'uno':
        playTone(ctx, now, 610, 0.09, 'triangle', 0.024, gainScale);
        playTone(ctx, now + 0.1, 760, 0.1, 'triangle', 0.022, gainScale);
        break;
      case 'callOut':
        playTone(ctx, now, 210, 0.1, 'sawtooth', 0.02, gainScale, 170);
        playTone(ctx, now + 0.1, 170, 0.12, 'sawtooth', 0.02, gainScale, 140);
        break;
      case 'deal':
        playTone(ctx, now, 360, 0.055, 'triangle', 0.022, gainScale, 300);
        playTone(ctx, now + 0.04, 300, 0.05, 'triangle', 0.018, gainScale, 260);
        break;
      case 'win':
        playTone(ctx, now, 520, 0.12, 'triangle', 0.022, gainScale, 760);
        playTone(ctx, now + 0.12, 760, 0.14, 'triangle', 0.022, gainScale, 980);
        break;
      case 'lose':
        playTone(ctx, now, 260, 0.11, 'triangle', 0.02, gainScale, 180);
        playTone(ctx, now + 0.12, 180, 0.16, 'triangle', 0.02, gainScale, 120);
        break;
      default:
        break;
    }
  } catch {
    // Autoplay / AudioContext policies — ignore.
  }
}
