// Regression coverage for gesture unlock, stale feedback, mute, and asset fallback.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaultAudioSettings, AUDIO_SETTINGS_KEY } from '../lib/audioSettings';

let now = 0;
let muted = false;
let enabled = true;
let volume = 0.65;
let sources = 0;
let audible = 0;
let stopped = 0;
let resume: (() => void) | undefined;
const windowEvents = new EventTarget();
const documentEvents = new EventTarget();
const param = () => ({
  value: 0,
  setValueAtTime() {},
  exponentialRampToValueAtTime() {},
});
class Node extends EventTarget {
  buffer: { length: number } | null = null;
  gain = param();
  frequency = param();
  playbackRate = param();
  Q = param();
  connect() {
    return this;
  }
  disconnect() {}
  start() {
    sources++;
    if (!this.buffer || this.buffer.length > 1) audible++;
  }
  stop() {
    stopped++;
    this.dispatchEvent(new Event('ended'));
  }
}
class Context extends EventTarget {
  static instance: Context;
  state = 'suspended';
  sampleRate = 44100;
  currentTime = 0;
  destination = new Node();
  constructor() {
    super();
    Context.instance = this;
  }
  resume() {
    return new Promise<void>((resolve) => {
      resume = () => {
        this.state = 'running';
        this.dispatchEvent(new Event('statechange'));
        resolve();
      };
    });
  }
  createBuffer(_channels: number, length: number) {
    return { length, getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    return new Node();
  }
  createGain() {
    return new Node();
  }
  createBiquadFilter() {
    return new Node();
  }
  createOscillator() {
    return new Node();
  }
}
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: Object.assign(windowEvents, {
    AudioContext: Context,
    localStorage: {
      getItem: (key: string) =>
        key === AUDIO_SETTINGS_KEY
          ? JSON.stringify({
              ...defaultAudioSettings,
              muted,
              chimesEnabled: enabled,
              sfxVolume: volume,
            })
          : null,
    },
  }),
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: documentEvents,
});
// Object.assign copies accessors; define visibility explicitly for each case.
Object.defineProperty(globalThis, 'performance', {
  configurable: true,
  value: { now: () => now },
});
globalThis.fetch = async () => {
  throw new Error('Offline: exercise immediate procedural fallback');
};
async function main() {
  const {
    playTableChime,
    primeTableAudioFromUserGesture,
    getTableAudioStatus,
  } = await import('../lib/tableChimes');
  const flush = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  playTableChime('cardPlay');
  assert.equal(audible, 0, 'locked audio does not queue old actions');
  primeTableAudioFromUserGesture();
  playTableChime('cardPlay');
  assert.equal(audible, 0, 'unlock is pending');
  assert.ok(resume);
  resume();
  await flush();
  assert.equal(getTableAudioStatus(), 'ready');
  assert.equal(
    audible,
    2,
    'first fresh effect survives asynchronous resume with texture + immediate contact',
  );
  const before = audible;
  playTableChime('draw');
  assert.equal(
    audible,
    before + 1,
    'offline fallback plays without waiting for a file',
  );
  muted = true;
  playTableChime('win');
  assert.equal(audible, before + 1);
  muted = false;
  enabled = false;
  playTableChime('win');
  assert.equal(audible, before + 1);
  enabled = true;
  volume = 0;
  playTableChime('win');
  assert.equal(audible, before + 1);
  volume = 0.65;
  Object.defineProperty(document, 'hidden', {
    value: true,
    configurable: true,
  });
  playTableChime('win');
  assert.equal(audible, before + 1, 'hidden tab stays silent');
  Object.defineProperty(document, 'hidden', {
    value: false,
    configurable: true,
  });
  Context.instance.state = 'suspended';
  primeTableAudioFromUserGesture();
  playTableChime('cardPlay');
  now += 200;
  resume();
  await flush();
  assert.equal(audible, before + 1, 'expired unlock feedback is discarded');
  Context.instance.state = 'suspended';
  primeTableAudioFromUserGesture();
  playTableChime('cardPlay');
  playTableChime('draw');
  resume();
  await flush();
  assert.equal(
    audible,
    before + 2,
    'only latest action follows unlock, never a backlog',
  );
  const beforePickup = audible;
  playTableChime('pickup');
  assert.equal(
    audible,
    beforePickup + 1,
    'pickup is immediate texture, without a tonal cue',
  );
  const beforeSpecial = audible;
  playTableChime('reverse');
  assert.equal(
    audible,
    beforeSpecial + 2,
    'special card uses paper and contact instead of a melody',
  );
  const beforeColdDraw = audible;
  Context.instance.state = 'suspended';
  primeTableAudioFromUserGesture();
  playTableChime('draw');
  resume();
  await flush();
  assert.equal(
    audible,
    beforeColdDraw + 1,
    'first draw survives cold-context gesture unlock',
  );
  const stoppedBeforeMute = stopped;
  muted = true;
  windowEvents.dispatchEvent(new Event('uno:audio-settings'));
  assert.ok(stopped > stoppedBeforeMute, 'mute stops active sources');
  const wav = readFileSync('public/audio/card-play.wav');
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  const dataAt = wav.indexOf(Buffer.from('data')) + 8;
  let peak = 0;
  let energy = 0;
  for (let i = dataAt; i + 1 < wav.length; i += 2) {
    const sample = wav.readInt16LE(i) / 32768;
    peak = Math.max(peak, Math.abs(sample));
    energy += sample * sample;
  }
  const rms = Math.sqrt(energy / ((wav.length - dataAt) / 2));
  assert.ok(
    peak > 0.2 && peak < 1,
    'recorded card sound has signal without clipping',
  );
  assert.ok(rms > 0.015, 'recorded card sound is not near silence');
  assert.ok(sources > 0);
  console.log(
    `Audio checks passed: unlock race, offline fallback, mute, hidden tab, expiry, no backlog. Card sample peak ${peak.toFixed(2)}, RMS ${rms.toFixed(3)}.`,
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
