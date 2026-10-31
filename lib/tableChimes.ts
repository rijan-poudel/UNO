// One low-latency audio context; card texture is generated once, never fetched on tap.
import { getAudioSettings } from './audioSettings';
import { audioUrlsForStem } from './audiosRegistry';
export type TableChime =
  | 'notification'
  | 'pickup'
  | 'cardPlay'
  | 'draw'
  | 'draw2'
  | 'wild4'
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
let recordedCard: AudioBuffer | null = null;
let loadingCard = false;
let recordedUno: AudioBuffer | null = null;
let loadingUno = false;
let resumeAttempt: Promise<void> | null = null;
let feedbackSequence = 0;
export type TableAudioStatus = 'locked' | 'ready' | 'unavailable';
export function getTableAudioStatus(): TableAudioStatus {
  if (typeof window === 'undefined') return 'locked';
  if (
    !window.AudioContext &&
    !(window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  )
    return 'unavailable';
  return context?.state === 'running' ? 'ready' : 'locked';
}
export function subscribeTableAudio(listener: () => void): () => void {
  window.addEventListener('uno:audio-status', listener);
  return () => window.removeEventListener('uno:audio-status', listener);
}
function notifyStatus(): void {
  window.dispatchEvent(new Event('uno:audio-status'));
}
function warmCard(ctx: AudioContext): void {
  if (loadingCard) return;
  loadingCard = true;
  void fetch('/audio/card-play.wav')
    .then((response) => {
      if (!response.ok) throw new Error('Card sound unavailable');
      return response.arrayBuffer();
    })
    .then((bytes) => ctx.decodeAudioData(bytes))
    .then((buffer) => {
      recordedCard = buffer;
    })
    .catch(() => {
      loadingCard = false;
    });
}
function warmUno(ctx: AudioContext): void {
  if (loadingUno) return;
  const path = audioUrlsForStem('uno')[0];
  if (!path) return;
  loadingUno = true;
  void fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error('UNO sound unavailable');
      return response.arrayBuffer();
    })
    .then((bytes) => ctx.decodeAudioData(bytes))
    .then((buffer) => {
      recordedUno = buffer;
    })
    .catch(() => {
      loadingUno = false;
    });
}
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
  if (!context || context.state === 'closed') {
    context = new Constructor({ latencyHint: 'interactive' });
    context.addEventListener('statechange', notifyStatus);
    notifyStatus();
  }
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
// Call synchronously inside a real gesture. A one-frame silent buffer unlocks iOS too.
export function primeTableAudioFromUserGesture(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    warmCard(ctx);
    warmUno(ctx);
    const silent = ctx.createBufferSource();
    silent.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    silent.connect(ctx.destination);
    silent.onended = () => silent.disconnect();
    silent.start();
    if (ctx.state !== 'running' && !resumeAttempt) {
      resumeAttempt = ctx
        .resume()
        .catch(() => {})
        .finally(() => {
          resumeAttempt = null;
          notifyStatus();
        });
    }
  } catch {
    notifyStatus();
  }
}
function playSample(
  ctx: AudioContext,
  buffer: AudioBuffer,
  volume: number,
  playbackRate = 1,
): void {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  gain.gain.value = volume;
  source.connect(gain).connect(ctx.destination);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  retain(source);
  source.start();
}
function cardTexture(
  ctx: AudioContext,
  volume: number,
  draw: boolean,
  pickup = false,
): void {
  if (recordedCard && !pickup) {
    playSample(ctx, recordedCard, volume * 0.85, draw ? 0.8 : 1);
    return;
  }
  // Fetch/decode never holds up the first card. This audible texture is the fallback.
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
  source.playbackRate.value = pickup ? 1.7 : draw ? 0.8 : 1.25;
  filter.type = 'bandpass';
  filter.frequency.value = pickup ? 3100 : draw ? 1500 : 2300;
  filter.Q.value = 0.6;
  gain.gain.value = volume * 0.85;
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
    Math.max(0.0001, volume * 0.2),
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
  const at = ctx.currentTime + 0.008;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(135, at);
  osc.frequency.exponentialRampToValueAtTime(65, at + 0.045);
  gain.gain.setValueAtTime(Math.max(0.0001, volume * 0.32), at);
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
function canSound(event: TableChime): boolean {
  const settings = getAudioSettings();
  return (
    !settings.muted &&
    (event === 'notification'
      ? settings.notificationsEnabled
      : settings.chimesEnabled) &&
    settings.sfxVolume > 0 &&
    !document.hidden
  );
}
export function playTableChime(event: TableChime): void {
  if (typeof document === 'undefined' || !canSound(event)) return;
  const sequence = ++feedbackSequence;
  const requestedAt = performance.now();
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'running') renderChime(ctx, event);
    else if (resumeAttempt) {
      // Only the latest fresh action may follow gesture unlock. There is no sound queue.
      void resumeAttempt.then(() => {
        if (
          sequence === feedbackSequence &&
          performance.now() - requestedAt < 160 &&
          ctx.state === 'running' &&
          canSound(event)
        )
          renderChime(ctx, event);
      });
    }
  } catch {
    /* Sound cannot interfere with play. */
  }
}
function renderChime(ctx: AudioContext, event: TableChime): void {
  try {
    const settings = getAudioSettings();
    const volume = settings.sfxVolume;
    if (event === 'notification') {
      [659, 880].forEach((frequency, i) =>
        tone(ctx, frequency, ctx.currentTime + i * 0.12, volume * 0.45),
      );
      return;
    }
    if (event === 'pickup') {
      cardTexture(ctx, volume * 0.52, false, true);
      return;
    }
    if (event === 'uno' && recordedUno) {
      playSample(ctx, recordedUno, volume);
      return;
    }
    if (['cardPlay', 'draw', 'deal', 'shuffle'].includes(event)) {
      cardTexture(ctx, volume, event === 'draw');
      if (event === 'cardPlay') landing(ctx, volume);
      if (event === 'deal') landing(ctx, volume * 0.6);
      return;
    }
    if (!['uno', 'win', 'lose', 'callOut'].includes(event)) {
      cardTexture(ctx, volume * 0.8, false);
      landing(ctx, volume);
    }
    if (
      ![
        'uno',
        'win',
        'lose',
        'callOut',
        'draw2',
        'wild4',
        'reverse',
        'skip',
      ].includes(event)
    )
      return;
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
      tone(
        ctx,
        frequency,
        ctx.currentTime + i * 0.08,
        volume *
          (['draw2', 'wild4', 'reverse', 'skip'].includes(event) ? 0.65 : 1),
      ),
    );
  } catch {
    /* Audio must never interfere with play. */
  }
}
