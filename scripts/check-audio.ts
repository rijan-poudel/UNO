// Regression coverage for gesture unlock, stale feedback, mute, and asset fallback.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaultAudioSettings, AUDIO_SETTINGS_KEY } from '../lib/audioSettings';
import { audioUrlsForStem } from '../lib/audiosRegistry';
import { initializeGame } from '../lib/gameSetup';
import type { LastAction } from '../types/game';

let now = 0;
let muted = false;
let enabled = true;
let notificationsEnabled = true;
let volume = 0.65;
let sources = 0;
let audible = 0;
let stopped = 0;
let resume: (() => void) | undefined;
const unoBuffer = { length: 22050 };
let finishUnoDecode: ((buffer: typeof unoBuffer) => void) | undefined;
const sampleStarts: { buffer: { length: number }; volume: number }[] = [];
const windowEvents = new EventTarget();
const documentEvents = new EventTarget();
const param = () => ({
  value: 0,
  setValueAtTime() {},
  exponentialRampToValueAtTime() {},
});
class Node extends EventTarget {
  buffer: { length: number } | null = null;
  output: Node | null = null;
  gain = param();
  frequency = param();
  playbackRate = param();
  Q = param();
  connect(output: Node) {
    this.output = output;
    return output;
  }
  disconnect() {}
  start() {
    sources++;
    if (!this.buffer || this.buffer.length > 1) audible++;
    if (this.buffer)
      sampleStarts.push({
        buffer: this.buffer,
        volume: this.output?.gain.value ?? 0,
      });
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
  decodeAudioData() {
    return new Promise<typeof unoBuffer>((resolve) => {
      finishUnoDecode = resolve;
    });
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
              notificationsEnabled,
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
    beforeSpecial + 5,
    'reverse combines paper contact with its bounded three-note direction cue',
  );
  const beforeColdDraw = audible;
  enabled = false;
  playTableChime('notification');
  assert.equal(
    audible,
    beforeColdDraw + 2,
    'Invitations use one short two-note cue',
  );
  enabled = true;
  notificationsEnabled = false;
  playTableChime('notification');
  assert.equal(
    audible,
    beforeColdDraw + 2,
    'Invitation sounds can be disabled independently',
  );
  notificationsEnabled = true;
  const beforeNotificationDraw = audible;
  Context.instance.state = 'suspended';
  primeTableAudioFromUserGesture();
  playTableChime('draw');
  resume();
  await flush();
  assert.equal(
    audible,
    beforeNotificationDraw + 1,
    'first draw survives cold-context gesture unlock',
  );
  assert.equal(defaultAudioSettings.chimesEnabled, true);
  assert.equal(defaultAudioSettings.voiceInGame, false);
  const beforeMissingUno = audible;
  playTableChime('uno');
  assert.equal(
    audible,
    beforeMissingUno + 2,
    'missing UNO clip immediately uses the existing two-tone fallback',
  );
  let unoFetches = 0;
  const unoPath = audioUrlsForStem('uno')[0];
  assert.ok(unoPath, 'UNO has a registered sound clip');
  globalThis.fetch = async (input) => {
    if (String(input) !== unoPath) throw new Error('Card sample stays offline');
    unoFetches++;
    return new Response(new ArrayBuffer(8));
  };
  primeTableAudioFromUserGesture();
  await flush();
  assert.ok(
    finishUnoDecode,
    'gesture warms and decodes the registered UNO clip',
  );
  const beforeLateUno = audible;
  playTableChime('uno');
  assert.equal(
    audible,
    beforeLateUno + 2,
    'a clip still decoding falls back immediately',
  );
  finishUnoDecode(unoBuffer);
  await flush();
  assert.equal(
    audible,
    beforeLateUno + 2,
    'late UNO decode never replays an action',
  );
  primeTableAudioFromUserGesture();
  await flush();
  assert.equal(unoFetches, 1, 'decoded UNO clip is cached across gestures');
  const beforeReadyUno = audible;
  playTableChime('uno');
  assert.equal(
    audible,
    beforeReadyUno + 1,
    'UNO plays one warmed sample with default narration off',
  );
  assert.equal(sampleStarts.at(-1)?.buffer, unoBuffer);
  assert.equal(
    sampleStarts.at(-1)?.volume,
    volume,
    'UNO follows sound-effect volume',
  );
  muted = true;
  playTableChime('uno');
  muted = false;
  enabled = false;
  playTableChime('uno');
  enabled = true;
  volume = 0;
  playTableChime('uno');
  volume = 0.65;
  Object.defineProperty(document, 'hidden', {
    value: true,
    configurable: true,
  });
  playTableChime('uno');
  Object.defineProperty(document, 'hidden', {
    value: false,
    configurable: true,
  });
  assert.equal(
    audible,
    beforeReadyUno + 1,
    'mute, disabled effects, zero volume, and hidden tab block UNO',
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
  const firstSignal = Array.from(
    { length: (wav.length - dataAt) / 2 },
    (_, i) => Math.abs(wav.readInt16LE(dataAt + i * 2)),
  ).findIndex((value) => value > 328);
  assert.ok(
    firstSignal >= 0 && firstSignal / wav.readUInt32LE(24) < 0.015,
    'card sample has no perceptible silent lead-in',
  );
  const {
    setAudioSettings,
    getAudioSettings,
    getMusicContextSettings,
    setMusicEnabledForContext,
  } = await import('../lib/audioSettings');
  let notifications = 0;
  windowEvents.addEventListener('uno:audio-settings', () => notifications++);
  setAudioSettings({ muted: false, chimesEnabled: true, sfxVolume: 0.4 });
  assert.equal(
    getAudioSettings().muted,
    false,
    'sound can be enabled when storage writes fail',
  );
  assert.equal(getAudioSettings().sfxVolume, 0.4);
  setAudioSettings({ muted: true });
  assert.equal(
    getAudioSettings().muted,
    true,
    'mute survives failed storage writes for this session',
  );
  assert.equal(
    notifications,
    2,
    'audio controls notify subscribers even when storage is blocked',
  );
  setMusicEnabledForContext('game', false);
  assert.equal(
    getMusicContextSettings().gameEnabled,
    false,
    'Music can be stopped when storage is blocked',
  );
  assert.equal(
    notifications,
    3,
    'Music controls immediately notify the player',
  );
  let spoken = 0;
  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    value: class {
      currentTime = 0;
      volume = 1;
      onplaying: (() => void) | null = null;
      pause() {}
      play() {
        spoken++;
        this.onplaying?.();
        return Promise.resolve();
      }
    },
  });
  Object.assign(window, { setTimeout, clearTimeout });
  const { playVoiceStem, stopBoardVoiceover, announceBoardFromTransition } =
    await import('../lib/voiceAnnouncer');
  const voiceOptions = {
    audience: { type: 'room' as const },
    localPlayerId: null,
    channel: 'check:voice',
    minGapMs: 0,
  };
  setAudioSettings({ muted: false, voiceInGame: false });
  playVoiceStem('skip', voiceOptions);
  assert.equal(spoken, 0, 'Disabled announcer stays silent');
  setAudioSettings({ voiceInGame: true });
  playVoiceStem('skip', voiceOptions);
  assert.equal(spoken, 1, 'Enabled in-game announcer still plays');
  setAudioSettings({ muted: true });
  playVoiceStem('reverse', voiceOptions);
  assert.equal(spoken, 1, 'Master mute blocks the announcer');
  setAudioSettings({ muted: false, voiceInGame: true });
  const game = initializeGame(['You', 'Bot']);
  const unoActions: LastAction[] = [
    {
      type: 'play',
      playerId: game.players[1].id,
      card: { id: 'uno-skip', color: 'red', value: 'skip' },
      declaredUno: true,
    },
    { type: 'declareUno', playerId: game.players[0].id },
  ];
  for (const [i, lastAction] of unoActions.entries()) {
    const beforeUno: number = audible;
    announceBoardFromTransition(
      game,
      { ...game, lastAction },
      null,
      `uno-${i}`,
    );
    playTableChime('uno');
    assert.equal(
      audible,
      beforeUno + 1,
      'UNO transition plays one basic sample with narration on',
    );
    assert.equal(
      spoken,
      1,
      'UNO neither duplicates narration nor competes with the played card line',
    );
  }
  const spokenBeforeCallOut = spoken;
  announceBoardFromTransition(
    game,
    {
      ...game,
      lastAction: {
        type: 'callOut',
        callerId: game.players[0].id,
        targetId: game.players[1].id,
        penalty: 2,
      },
    },
    null,
    'call-out',
  );
  assert.equal(
    spoken,
    spokenBeforeCallOut + 1,
    'Other existing announcer lines remain available',
  );
  stopBoardVoiceover();
  assert.ok(sources > 0);
  console.log(
    `Audio checks passed: unlock race, offline fallback, mute, hidden tab, expiry, no backlog. Cached UNO, immediate fallback, narrator independence, blocked storage and prompt sample onset passed. Card sample peak ${peak.toFixed(2)}, RMS ${rms.toFixed(3)}.`,
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
