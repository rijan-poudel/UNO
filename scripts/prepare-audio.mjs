// Rebuild compact announcer clips from the original WAV exports.
// Requires ffmpeg. Original recordings remain in public/audios.
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const source = 'public/audios';
const output = 'public/audio/voice';
mkdirSync(output, { recursive: true });
let originalBytes = 0;
let outputBytes = 0;
for (const file of readdirSync(source).filter(
  (name) => name.endsWith('.wav') && name !== 'background_music.wav',
)) {
  const input = join(source, file);
  const target = join(output, file.replace(/\.wav$/, '.mp3'));
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      input,
      '-af',
      'silenceremove=start_periods=1:start_duration=0.015:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_duration=0.04:start_threshold=-45dB,areverse,afade=t=in:d=0.008,loudnorm=I=-19:TP=-2:LRA=9',
      '-ar',
      '44100',
      '-ac',
      '1',
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '80k',
      target,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0)
    throw new Error(`Could not prepare ${file}: ${result.stderr}`);
  originalBytes += statSync(input).size;
  outputBytes += statSync(target).size;
}
console.log(
  `Prepared voice clips: ${(originalBytes / 1024 / 1024).toFixed(2)} MB → ${(outputBytes / 1024 / 1024).toFixed(2)} MB`,
);

const musicResult = spawnSync(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    join(source, 'background_music.wav'),
    '-af',
    'loudnorm=I=-22:TP=-3:LRA=11',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '112k',
    'public/audio/music.mp3',
  ],
  { encoding: 'utf8' },
);
if (musicResult.status !== 0) throw new Error(musicResult.stderr);
console.log('Prepared optional background music.');
