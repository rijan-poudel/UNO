# UI and interaction refinement — October 24

Implemented overflow paging with real edge availability, extra clearance at both ends of large fans, one roving hand Tab stop, keyboard reveal without pointer recentering, and native button semantics for cards. Inspection now names the card, explains the match/finish restriction, and dismisses through Close, Escape or an outside tap. Wild choices show actual remaining hand counts by color, focus the first color, support arrows/Home/End and R/Y/G/B, and fit short landscape without cramped keyboard badges.

Fixed an observed online wild regression: its preparation metadata cleared the remembered card origin and keyboard focus intent before confirmation. Presentation now retains that intent until cards change; the browser confirmed focus returns to the neighboring hand card after confirmation.

## Verification

Passed npm run lint, npm run check:types, npm run check:game, npm run check:audio, npm run build and npm run check:multiplayer. Multiplayer used an isolated real server on port3014 because another project occupied3001. No framework or dependency installed. git diff --check passed.

Browser used the real UI against a loopback-only six-seat fixture on3013 and a separate source copy served on3012. HAND22 gives20cards with known legal/illegal/wild choices and no automated bots; it never records a completed round. Verified1440×900,844×390,568×320 and390×844portrait. Landscape document bounds equal the viewport, the fan stays horizontal, arrows reflect scroll availability, Home/End reveals endpoint cards, and exactly one hand card has tabIndex0. Tab exits the hand immediately. A short29px lift kept21cards and left no held clone; a91px upward drag played immediately and reduced the hand to20. Drawing revealed the new playable card and reachable44px Pass. Cancel returned focus to the wild; color-key confirmation published the selected green and reduced the hand20to19. After the focus fix, focus landed on the neighboring blue Skip and the hand still had one Tab stop. Browser error log was empty.

The final optimized build is served on127.0.0.1:3205, where Play and the updated wild chooser were smoke checked. Temporary deterministic fixtures were not added to application routes. Existing card art, rules, local progress, theme and concurrent motion work are preserved.

## Design checks

One detector pass recorded45advisories in inherited arena values. They were reviewed and retained as file-and-value-scoped exceptions for intentional compact type, card geometry/contact ink and final club.css palette overrides. Card-material advisories are scoped to their existing laminate/painted-menu values. No file or entire rule was disabled. Real fixes addressed phone color-choice spacing, fan-end clearance, keyboard entry/exit, inspection recovery and online wild focus. The native deck and selected comic world stay intact.

Reduced-motion CSS and instant paging guards were checked in source; no physical touch, speaker, Safari or emulated reduced-motion certification is claimed. The scope is these tested paths, not a guarantee that every possible game issue has been eliminated.
