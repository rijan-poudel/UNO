# Target-choice Cancel polish

- Replaced the raised blue secondary action with a quiet surface control using existing arena tokens.
- Removed the inherited UNO/Pass grid columns from the target-choice action group, so its close icon retains its full width.
- Preserved a 44px tap target and added explicit keyboard focus, hover and pressed states.
- The shared control covers seven-card swaps, Wild Forced Swap and Targeted Draw Two.
- Inspected the live target-choice view at 1280 × 720 and 844 × 390. Screenshots: `desktop.png`, `phone.png`.
- Clicking Cancel and pressing Escape both returned to the unchanged seven-card hand and restored focus to the originating card.
- Passed formatting, lint, TypeScript, game assertions, audio assertions, all automated multiplayer checks and production build. No manual multiplayer session was used.
- Design-hook exceptions are scoped to existing arena game-state colors and the existing 17px knockout label; the new Cancel control uses existing tokens and an 8px radius. The automatic hook reports no remaining deterministic findings.
