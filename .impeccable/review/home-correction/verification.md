# Home correction and gameplay verification

Scope: replace the rejected centered poster home with the user-selected opening hand, enable same-type stacking by default, and investigate reproducible engine/server/state problems. This is a bounded audit of the main play flows, not a claim of a bug-free repository.

## Functional changes

- New device/table defaults enable +2-on-+2 and +4-on-+4; mixed +4-on-+2 remains explicit. Untouched old Classic defaults migrate once; later explicit Classic choices persist. Current rounds/rematches retain their rules.
- Pending-penalty guidance no longer suggests a legal stack when none exists.
- Runtime rule validation rejects wrong field types, unsafe hand sizes and player limits. Deals reserve enough cards for a valid opener. Online room flags/state commit only after a valid deal.
- Final-action restrictions apply consistently to stacks, jump-ins and Discard All finishes.
- Wild jump-in color choice uses the jumping player's hand; pending choice suspends bots locally and online.
- An authoritative drawnThisTurn field prevents repeat draws/premature passes, survives UNO metadata and reconnect, and resets when the turn advances.
- Drawing clears a prior UNO declaration. Draw-until-playable checks the resulting hand. Exhausted-deck draws advance once; bot continuations honor an already-drawn turn.

## Checks

Passed npm run lint, check:types, check:game, check:audio, build and check:multiplayer. The multiplayer suite exercised real sockets on an isolated server in the prior turn and again against the current development server on3001. No test framework installed. Engine regressions include cross-color +2, +4 accumulation, explicit Classic persistence, malformed preferences, rule validation, final-action restrictions, jump-ins, draw sequencing and bot continuation, plus60 completed randomized rounds with conservation/immutability checks.

## Browser evidence

Browser automation uses the in-app browser. Final home captures cover1586x992 (approved comp width),1440x900,1280x720,390x844 and568x320. Captures are full-page and can be taller than the viewport due to real local progress; hero-repro.png uses an explicit1586x992 clip. Every submitted image was opened and checked for correct content/loading. No horizontal overflow at568.

Live Settings showed Stack party selected, +2 and +4 stacking on, mixed stacking off. Create, Join, Setup and inline Help navigation work. Six-seat play with12cards at844x390 had document size844x390; Enter on blue+2 played immediately and changed the hand12to11. Test seat count/hand size restored to the prior3seats/7cards afterward. No synthetic round result recorded. Real history stayed1round/0wins.

Reduced motion is implemented in CSS guards; no physical-touch, speaker, Safari or browser-emulated reduced-motion certification is claimed. Native dialog/focus behavior and existing gesture assertions remain in the checks.

## Design evidence

Seed de7d70fe, dealt7/4/2, user selected opening-hand through b866813a. Exact returned answer persisted in questions/b866813a.answer.json; comp sidecar approved. Fresh review rejected the initial CSS-only card material, so printed card rasters were produced. Full review after rebuild accepted the focal material and identified isolated fixes. Final disposition recorded in the finish review files. No second detector: its58findings were all advisory against old DESIGN.md. All9public artwork rasters have embedded provenance.

Production smoke: built Next.js app served temporarily on3212. Enter on the primary menu started a new3seat/7card table. Its random opener was yellow+2 while the hand held blue+2, exactly reproducing the reported cross-color case. Enter on blue+2 played first activation, hand7to6, pending2to4, nextplayerCleo. Captured stack-before.png and stack-after.png; no result recorded. Production preview stopped afterward; normal development preview remains.

Final reviewfix evidence: red/blueprintedindices have corrected blackringswithcreamoutlines; bothshortlandscape supportcontrols measure45.5px high, y182.4–227.9 and235.9–281.4 inside320; canonicalhero physicalimage dimensions verified1586x992. Source guard forreducedmotionremains; no additional detector scan was run.
