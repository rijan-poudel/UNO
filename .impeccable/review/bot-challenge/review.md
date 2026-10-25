# Bot challenge

Local Color play extension, October 25, 2026. Add a shared native Casual/Standard/Tactical selector in bot options, Settings and host table rules. Preserve the existing visual world and direct-play flow. No replacement comp, imagery, palette or motion. The only CSS addition keeps the select at 16px to avoid phone focus zoom.

Independent finish review: **ship**, no material fixes. The review covered the new controls and their responsive integration, rather than a whole-site audit. Keep the native selector, descriptive copy, visible keyboard focus and compact collapsed setup.

Captures: desktop.png (1280×720), landscape.png (568×320), mobile.png (full-page 390×1175), mobile-collapsed.png (390×844), online.png (full-page 1280×1516). The full-page captures use 390×844 and 1280×720 viewports respectively. The screenshot API returned JPEG bytes under these conventional screenshot names. At the initial phone scroll position, the complete Deal action ends at 819px within the 844px viewport.

Browser verification: keyboard selection; Tactical preserved across preset switch and refresh; quick play starts Tactical; changing future preferences to Casual does not alter the resumed Tactical round; online room publication and the active online game menu both show Tactical. Settings header, selector and Done remain reachable in short landscape. No horizontal overflow.

Verification passed: lint, strict types, game, audio, live multiplayer and production build. The bot checks complete 27 six-seat rounds across three levels and three presets, verify immutable inputs and deck conservation, and compare decisions against private recipient views to exclude hidden-card advantage. Existing Standard behavior and turn pacing remain intact. No new dependencies or design-detector suppressions.
