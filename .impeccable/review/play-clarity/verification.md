# Verification

- All six engine-backed practice scenes completed in the browser: stacking, seven swap, Roulette, Skip Two, targeted +2 and forced swap. Actual result counts and next-player behavior matched the engine assertions.
- Online All Wild target choice entered directly on the two opponent portraits, focused the first target, disabled competing card/draw actions and retained the timer. Escape left the seven-card hand unchanged and restored focus to the selected card. Keyboard activation on the second target exited selection and submitted the move; later observation found the disposable round completed, so the precise intermediate swap snapshot was not captured.
- Desktop, portrait help and landscape targeting captures opened correctly. Short-screen help retains its header, Close, independently scrolling body and fixed Done. Physical touch, hinge behavior and audible quality were not assessed.
- Assertion checks cover full deck conservation, immutable input, minimum +6 versus total 10, higher stack totals, all six effects, native target button names, and deferred mounting of optional examples.
- Types, lint, game, audio, production build and multiplayer suites passed. The initial multiplayer attempt had no running socket service; rerunning with the service succeeded.
- No dependencies or protocols changed. Original user game tab was not reloaded. Disposable online rooms used the ordinary game controls.
- Final production preview confirmed the corrected practice-target button spacing; captured warn/error logs were empty. No Mercy selection and normal viewport restored after testing.
