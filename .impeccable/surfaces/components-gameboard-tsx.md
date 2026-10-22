---
version: 1
slug: "components-gameboard-tsx"
primary_target: "components/GameBoard.tsx"
related_targets: ["app/arena.css", "components/HandCard.tsx", "hooks/usePhonePortrait.ts"]
---

Visitor mode: Experience. Scope: live local/online game and phone orientation gate.
Job: find a lifted legal card, tap/flick or draw; keep the piles close to that hand and every card reachable within the viewport.
Direction: owner-selected illustrated game room: warm furniture above a clear petrol-blue tabletop, static cover artwork at center30%. Opaque compact player identities protect contrast. No baize/leather rail, casino furniture or giant blue ovals. Native saturated cards, Outfit/Barlow, original expressive card avatars remain. Quiet header has logo and one44px icon-only Menu; sound and room copy inside. No visible routine Your move/color/status/count HUD. Chosen wild color, pending deck penalty, contextual decisions and accessible announcements remain.
Composition: bottom-anchored piles join the hand into one play group. Desktop opponents have readable larger identities and backs; compact phone identities retain avatars. Landscape hand rows reserve enough space for normal faces before focus. Contextual decisions sit in a separate right-side lane.
Signature: the held fan rises a little on your turn; legal cards rise/grow further. The lower quarter sits below the viewport edge. Its scrollport still contains full cards, so focus/hover tops cannot clip; horizontal large-hand scrolling never scrolls the page. Direct legal tap/flick remains immediate. No animation/audio gates engine turns.
Phones: landscape only, compact six-seat identities, readable20-card hands. Portrait rotate gate pauses local bots/auto-pass and discloses online continuation. Home/setup remain portrait-friendly.
Materials: UnoCard.module.css owns shared print, stock edges and fine-pointer3D/sheens. app/arena.css is current live layout/background authority after legacy app/table.css. Reduced motion keeps state changes static.
Proof: .impeccable/review/closer-table/ supersedes earlier layout approval after the owner rejected the shipped UI. .impeccable/review/illustrated-room/ retains the explicit room selection and provenance; .impeccable/review/play-field/ retains geometry and interaction evidence. Required user848×765, desktop1440×900, landscape568×320/844×390 with six seats/20cards and focus;390×844portrait. Physical touch/speaker quality is not established by browser tests.
