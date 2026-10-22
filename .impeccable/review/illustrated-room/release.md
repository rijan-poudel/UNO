# Public release verified — 2026-10-22

The prior deployment delay cleared. GitHub reports successful Vercel status for retry commit e67090abe244b3d99584e77e8b2683cde31b7032, and Production deployments exist for it and implementation commit2569076fd6f638573db6a43963d0fbac8b721d99. The public page at https://uno-wheat-ten.vercel.app/ now renders /artwork/game-room-evening.webp behind live native cards. The formerly reported deployment-access limitation did not prevent the existing Git integration from completing.

## Public browser smoke check

Fresh isolated Chromium contexts against the public URL, without changing existing user tabs or storage. Opened both saved captures and validated their contents.

- public-desktop-20261022.png:1440×900, actual bot round, loaded original room, direct legal blue0 activation, native menu opening and no page errors. DOM document dimensions1440×900.
- public-landscape-20261022.png:844×390 touch/mobile context, actual bot round after deal motion settled, loaded room, complete upper card faces above intentional viewport crop. DOM document dimensions844×390; hand scrollTop0.
- Rotation to390×844 displays “Turn your phone. Take your seat.” rather than portrait gameplay.

The first phone screenshot caught the opening deal in flight and was replaced with the settled capture. This is release verification, not a new design review or change to the previously reviewed geometry. Physical phone touch and speaker quality remain unverified.

## Public multiplayer smoke check

Two independent Socket.IO websocket clients connected to https://uno-411x.onrender.com with the public frontend Origin. A disposable private room passed create, join, two-seat start and acknowledged human draw. Both clients explicitly left and disconnected in cleanup. No existing room was touched.

The implementation/retry commits' Verify game checks passed (lint, strict types, game/audio/multiplayer assertions, production build and production-dependency audit). This release record changes no app code. Main checkout's unrelated globals.css, table.css and GameFeedback.tsx edits remain unstaged and unmodified.
