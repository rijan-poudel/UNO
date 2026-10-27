# Verification — October 26

- `npm run format`, `npm run format:check`, `npm run lint`, `npm run check:types`, `npm run check:game`, `npm run check:audio`, `npm run build`: passed.
- `npm run check:multiplayer` against the running socket server: passed, including accepted friendships, ownership rejection, persistence/reconnect, invitation acceptance and removal.
- Two independent browser identities on localhost and 127.0.0.1: request from roster, recipient accepts in Friends, mutual accepted lists, accepted-only invite picker, actionable room invitation over an open settings dialog, Accept joins the sender's room.
- Closed avatar editor and progress have no mounted content; only the active account panel renders. Classic hides custom rule controls. A named custom profile saves, appears in the chooser and labels the next table.
- Game DOM has no `.hand-caption` or `.action-hint-banner`; routine hints remain available to assistive technology. Discard All routes directly through the same tested removal/atomic-UNO action without opening `CardPlayDialog`.
- Desktop 1280×900, actual user panel 826×765, phone 390×844 and short landscape 568×320 captured. Settled dialog opacity was checked; saved captures opened and validated. Short landscape keeps section navigation and Done visible around a scrolling panel.
- No dependencies or test framework added. Existing unrelated table/material detector findings were preserved without suppression. No new shipping raster assets.

Standard play reference: [Mattel UNO instruction sheet](https://service.mattel.com/instruction_sheets/FFK04-Eng.pdf). Classic is the sole built-in preset. Custom rules are optional named profiles; the existing timed-turn policy remains. Tournament scoring and bluff/challenge interactions are not implemented or advertised.

Durable social storage uses `.data/friends.json` by default. A deployed socket service needs `UNO_SOCIAL_FILE` on a persistent volume and one writer process, as documented in `.env.example` and `docs/ARCHITECTURE.md`.
