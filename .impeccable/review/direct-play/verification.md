# Verification

Local preview uses localhost:3000 and the existing loopback-only `.impeccable/review/play-feedback/fixture.mjs`; never deploy the fixture. Captures named large-hand are six seats with a real-engine seeded 13-card hand after drawing green Reverse; near-finish is a seeded two-card hand. These are not public matches. Every saved capture was opened with emitImage and verified nonblank/settled. Viewports: 390x844, 320x740, 1440x900. Wild dialog captured at 320x740.

Browser behavior observed:
- Ordinary three-seat round: one tap on legal yellow 7 changed 7 cards to 6 and the discard to yellow 7.
- The first inspection caught overlap causing a neighboring face to receive a center tap. Phone overlap was reduced from60px to36px (30px at320); direct Play yellow7 then passed. This correction is in the current captures.
- Browser reported Turn sound off/pressed after real pointer gesture, confirming context running; physical speaker quality was not certified.
- Native drag of green Discard all from approximately156,672 to160,390 changed two cards to one and updated the pile. No extra click needed.
- Short green Reverse drag20px returned without playing; hand remained13, no ghost or receiving class remained.
- ArrowRight from green Reverse moved focus to blue9 and scrolled the large hand.
- Physical deck click exposed pending state, then drew green Reverse into view; Pass appeared only after draw.
- One tap on Wild+4 opened native color dialog; Keep the wild card returned unchanged two-card hand with UNO available.
- Reduced motion verified from source guards; this browser does not expose a reduced-motion override.

Assertions passed: lint, strict types, game60rounds, audio unlock/offline/mute/expiry/noqueue plus immediate pickup and nonmelodic reverse, gesture thresholds, real multiplayer server. Final build in progress when packet written. Normal socket must be restored after fixture use.

Potential review focus: landing cue text appears at lift while release threshold requires a more deliberate upward release; use the code to assess consistency. Large desktop hand screenshot shows bottom-corner clipping near the scrolling strip; judge actual card usability, not decorative viewport density.

## Rebuilt mat-and-rail region / fresh full review

The first reviewer returned rebuild. Replaced crossed grid entirely with generated baize and padded-leather JPEG materials. Both are visibly rendered with soft-light grading, native responsive clipping. Exact built-in image-generation prompts are beside the two shipping rasters in public/textures; embedded metadata scan passes (two rasters, zero missing), combined assets about424KB. No abandoned shipping raster.

Landing feedback now has lifting/ready/null states. Readiness and release call exactly the same pure distance predicate (upward beyond65px, dominant vertical); there is no velocity readiness that expires while holding still. A fast upward flick beyond the same distance also plays. Every direct act (deck Draw, D, Pass, Play, color confirm and call-out) primes synchronously in act; UNO paths prime explicitly. Cold-context draw has an audio assertion. The browser reports sound running, but the harness provides no sound-output capture or physical speakers, so listening is not certified.

Yellow center ranks now use #8b600b on #fffdf5; vivid yellow shells remain. Large-desktop fan strip height260px gives actual outer corners clearance without reducing cards. All six current captures were overwritten/opened after the rebuild: large-hand320/390/1440, near-finish320/390, wild320. Stable snapshots; pointer moved to blank header before captures. Original lower-corner clipping and gridded texture screenshots have been replaced by current evidence. Full review requested, not a fix-list verdict.
