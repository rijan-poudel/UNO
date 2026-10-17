// One low-latency audio context; card texture is generated once, never fetched on tap.
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
let context: AudioContext | null = null;
let paper: AudioBuffer | null = null;
let lastMotionAt = 0;
const voices = new Set<AudioScheduledSourceNode>();
function retain(source: AudioScheduledSourceNode): void {
  voices.add(source);
  source.addEventListener('ended', () => voices.delete(source), { once: true });
}
function stopFeedback(): void {
  voices.forEach((source) => {
    try {
      source.stop();
    } catch {}
  });
  voices.clear();
}
let listening = false;
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Constructor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Constructor) return null;
  context ??= new Constructor({ latencyHint: 'interactive' });
  if (!listening) {
    listening = true;
    window.addEventListener('uno:audio-settings', () => {
      const settings = getAudioSettings();
      if (settings.muted || !settings.chimesEnabled || settings.sfxVolume <= 0)
        stopFeedback();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopFeedback();
    });
  }
  return context;
}
export function primeTableAudioFromUserGesture(): void {
  try {
    const ctx = getContext();
    if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
  } catch {}
}
function cardTexture(ctx: AudioContext, volume: number, draw: boolean): void {
  if (!paper) {
    paper = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * 0.085),
      ctx.sampleRate,
    );
    const data = paper.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = paper;
  source.playbackRate.value = draw ? 0.8 : 1.25;
  filter.type = 'bandpass';
  filter.frequency.value = draw ? 1500 : 2300;
  filter.Q.value = 0.6;
  gain.gain.value = volume * 0.28;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  retain(source);
  source.start();
}
function tone(
  ctx: AudioContext,
  frequency: number,
  at: number,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, volume * 0.07),
    at + 0.008,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
  osc.connect(gain).connect(ctx.destination);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  retain(osc);
  osc.start(at);
  osc.stop(at + 0.15);
}
function landing(ctx: AudioContext, volume: number): void {
  const at = ctx.currentTime + 0.2;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(135, at);
  osc.frequency.exponentialRampToValueAtTime(65, at + 0.045);
  gain.gain.setValueAtTime(Math.max(0.0001, volume * 0.16), at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.065);
  osc.connect(gain).connect(ctx.destination);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  retain(osc);
  osc.start(at);
  osc.stop(at + 0.07);
}
export function playTableChime(event: TableChime): void {
  const settings = getAudioSettings();
  if (
    settings.muted ||
    !settings.chimesEnabled ||
    settings.sfxVolume <= 0 ||
    (typeof document !== 'undefined' && document.hidden)
  )
    return;
  try {
    const ctx = getContext();
    // Drop feedback while locked; resuming later must never replay an old action.
    if (!ctx || ctx.state !== 'running') return;
    const volume = settings.sfxVolume;
    if (
      ['cardPlay', 'draw', 'deal', 'shuffleMotion', 'shuffle'].includes(event)
    ) {
      cardTexture(ctx, volume, event === 'draw');
      if (event === 'cardPlay') landing(ctx, volume);
      if (event === 'deal')
        [0, 0.055, 0.11].forEach((delay) =>
          tone(ctx, 185 + delay * 300, ctx.currentTime + delay, volume * 0.35),
        );
      return;
    }
    if (!['uno', 'win', 'lose', 'callOut'].includes(event)) {
      cardTexture(ctx, volume * 0.8, false);
      landing(ctx, volume);
    }
    const notes: Partial<Record<TableChime, number[]>> = {
      skip: [430, 330],
      reverse: [392, 523, 392],
      draw2: [330, 270],
      wild4: [300, 230],
      wild: [392, 494, 587],
      uno: [620, 820],
      callOut: [300, 220],
      win: [523, 659, 784, 1047],
      lose: [330, 260],
    };
    (notes[event] ?? [420]).forEach((frequency, i) =>
      tone(ctx, frequency, ctx.currentTime + i * 0.08, volume),
    );
  } catch {
    /* Audio must never interfere with play. */
  }
}
export function playShuffleMotionChime(): void {
  const now = performance.now();
  if (now - lastMotionAt < 80) return;
  lastMotionAt = now;
  playTableChime('shuffleMotion');
}
