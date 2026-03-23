/**
 * Maps game logic stems → exact file basenames in `public/audios/` (your exports).
 * Do not rename files: URLs are built from these strings + `.wav` (then mp3/m4a/ogg).
 */

export const AUDIOS_PUBLIC_PATH = '/audios';

const EXTS = ['wav', 'mp3', 'm4a', 'ogg'] as const;

/**
 * Each stem → one or more exact BaseNames as returned by the filesystem (no extension).
 */
export const STEM_TO_AUDIOS: Record<string, readonly string[]> = {
  // ── game start ──
  shuffle_time: ['Shuffle time!'],
  new_hand: ['New hand!'],
  switch_up: ['Switch Up!'],
  lets_play: ["Let's Play"],
  game_on: ['Game ON!'],
  uno_time: ['UNO TIme! '],
  cards_out: ["Card's out"],
  lets_go: ["Let's go!", "Let's go! ", "Let's go", "Let's go-2"],

  // ── skip / deny ──
  skipped: ['Skipped'],
  sit_down: ['Sit down!'],
  nope: ['Nope'],
  bye_bye: ['Bye bye'],
  not_you: ['Not you'],
  all_skipped: ['All skipped!', 'All skipped!-2'],

  // ── reverse ──
  reversed: ['Reversed'],
  other_way: ['Other way'],
  flip_it: ['Flip it!', ' Flip it!'],
  turn_around: ['Turn Around'],
  switchback: ['Switch Back'],

  // ── +2 play ──
  draw_two: ['Draw two', 'Draw two! '],
  pick_up: ['Pick Up!'],
  two_cards: ['two cards'],
  ouch: ['Ouch!'],
  sorry_not_sorry: ['Sorry Not sorry!'],

  // ── +4 / pain ──
  draw_four: ['Draw four'],
  plus_four: ['plus four'],
  oh_no: ['Oh!no!', 'Ohhh no!'],
  big_trouble: ['Big trouble!'],
  take_that: ['Take that'],
  yikes: ['Yikes'],

  // ── stack ──
  stack_it: ['Stack it!'],
  plus_two_more: ['Plus two more'],
  keep_going: ['Keep going!', ' Keep going!'],
  whos_brave: ['Who is brave_'],
  stack_of_four: ['Stack of four'],
  double_trouble: ['Double Trouble!'],
  its_piling_up: ["It's piling up!"],
  no_escape: ['No escape!'],

  // ── wild / color text ──
  wild_card: ['WIld cards'],
  color_change: ['Color Change'],
  pick_one: ['Pick One!', 'Pick One'],
  your_call: ['Your call'],
  wild_out: ['Wild out!'],

  // ── shuffle hands ──
  who_got_what: ['Who got what_ '],
  bye_cards: ['Bye, cards!'],
  switch_decks: ['Switch desks!'],
  flipped: ['Flipped! '],
  dark_side: ['Dark side!'],
  light_side: ['Light side! '],
  flipped_back: ['Flipped back! '],
  back: ['Back!'],

  // ── discard all / table ──
  dump_them: ['Dump them!'],
  all_gone: ['All gone!'],
  color_purge: ['Color purge'],
  out_they_go: ['Out they go!'],
  table_cleared: ['Table cleared!'],
  everyone_out: ['Everyone Out!'],

  // ── nice play ──
  nice_one: ['Nice One!'],
  smooth: ['Smooth'],
  clean_play: ['Clean Play'],

  // ── UNO declare ──
  uno: ['UNO!'],
  one_card: ['One card! '],
  almost_out: ['Almost out!'],
  so_close: ['So close!', 'So close! '],
  watch_out: ['Watch out! '],

  // ── call-out ──
  bad_call: ['Bad call!'],
  its_legal: ["It's legal!"],
  gotcha: ['Gotcha!'],
  caught: ['Caught! '],

  // ── colors ──
  red: ['Red!'],
  blue: ['Blue!'],
  yellow: ['Yellow!'],
  green: ['Green!'],

  // ── draw (voluntary / forced) ──
  drawing: ['Drawing...'],
  go_fish: ['Go fish!'],
  cross_fingers: ['Cross fingers!'],

  buried: ['Buried!'],
  stacked_out: ['Stacked out! '],
  too_many_cards: ['Too many cards! '],
  brutal_stack: ['Brutal stack! '],

  // ── win / lose ──
  you_won: ['You won!'],
  winner: ['Winner!'],
  first_place: ['First place!'],
  champion: ['Champion!'],
  unstoppable: ['Unstoppable!'],
  too_easy: ['Too easy! '],

  last_place: ['Last place!'],
  rough_one: ['Rough one! '],
  try_again: ['Try again!'],
  next_time: ['Next time!'],
  shake_it_off: ['Shake it off!'],
  comeback_time: ['Comeback time! '],

  // ── lobby / UI (outside board) ──
  connecting: ['Connecting... '],
  almost_ready: ['Almost ready! '],
  starting_soon: ['Starting soon! '],
  disconnected: ['Disconnected!'],
  waiting: ['Waiting... '],
  player_joined: ['Player joined! '],
};

export function audioUrlsForStem(stem: string): string[] {
  const basenames = STEM_TO_AUDIOS[stem];
  if (!basenames?.length) return [];

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const base of basenames) {
    for (const ext of EXTS) {
      const path = `${AUDIOS_PUBLIC_PATH}/${encodeURIComponent(base)}.${ext}`;
      if (!seen.has(path)) {
        seen.add(path);
        urls.push(path);
      }
    }
  }
  return urls;
}

/** Stems referenced anywhere in voice rules (for type-safety checks in dev). */
export type KnownAudioStem = keyof typeof STEM_TO_AUDIOS;
