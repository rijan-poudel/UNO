# Legacy flow cleanup — October 26

Removed the unused TableRules component, abandoned page/button/segmented helpers, the unreachable Discard All confirmation UI, duplicate game-menu settings and the old avatar-trigger fallback. Production presets contain Classic only; custom-rule combinations now live in scripts/ruleScenarios.ts for engine coverage.

Removed obsolete friend-status polling protocol/types, nonfunctional connection voice hooks and unused announcer/chime/turn helpers. In-game voice keeps its original mute, volume and expiry behavior; check:audio now explicitly verifies disabled, enabled and muted announcer playback.

Deleted over 1,000 lines of unused home, inbox, settings-tab, avatar, inline-rule and teaching-hint styles. Live arena geometry, theme controls, accepted friendships, custom rules, native card faces and historical artwork remain intact. No warning suppression or new dependency was added.

Passed: format, format:check, lint, check:types, check:game, check:audio, build and the complete check:multiplayer protocol checks against the running socket server.

Browser verification used the production build on port 3004: one-code joining, avatar → Game settings, bot setup, six seats at 568×320, zero document overflow, absent hand coaching, simplified table menu and read-only current rules opened through the avatar. Saved bot count was restored after verification. Screenshots were opened and validated. The preview returns to Home with its normal viewport.
