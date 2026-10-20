# Verification record

User corrections govern this pass, including latest instruction: phone gameplay is landscape only, never portrait. Home/setup remain portrait-friendly. This is a code-led adaptation, no approved raster comp. Skill seed2e1e4271 is inherited from the owner-pinned title-screen direction; no new concept roll.

## Required capture matrix (current captures)

- home-desktop.jpg1440×900; home-user-845.jpg845×765 (full page799px, all primary actions visible within765); home-phone.jpg390×844; home-small-phone.jpg320×568.
- game-user-845.jpg, game-hover-845.jpg and game-focus-845.jpg845×765:3 seats7 cards; hover/focus fully raised over neighbors.
- game-desktop.jpg1440×900, same table.
- game-user-six.jpg845×765:6 seats20 cards, scrolled to right.
- game-landscape-three.jpg844×390:3 seats7cards.
- game-landscape-six.jpg844×390 and game-small-landscape-six.jpg568×320:6 seats12cards.
- game-landscape-twenty.jpg844×390 and game-small-landscape-twenty.jpg568×320:6 seats20cards; final-card keyboard focus and horizontal reveal.
- game-portrait-gate.jpg320×568: phone gameplay hidden from layout/accessibility, clear rotate prompt and explicit online-continuation copy.
- game-landscape-menu.jpg568×320: native scrollable menu with direction/next-player information rather than unexplained floating arrow.
- game-landscape-wild.jpg844×390: native color dialog; one-tap wild activation opens it.

All screenshots were opened and inspected; no unloaded images, black frames or incomplete scene. Earlier portrait gameplay captures are obsolete after user's steering and removed. Captures are dev preview so Next dev badge at bottom is not production UI.

## Observed mechanical evidence

At845×765: document scrollHeight765 and scrollWidth845. Draw/discard group y225–395, upper seats y75–176 (Catch ends220 on a separate left lane), cue near466, hand scrollport y477–713. Raised green discard-all y498–659 (clear of clip top477 and bottom713); elementFromPoint at raised top hits the raised card itself. Focused card likewise inside the scrollport. One unified felt extends behind local hand, no separate hand toolbar.

At844×390,20cards: document height390, hand scrollport y192–354, final focused card y206–320 x727–804, scrollLeft299/scrollWidth1160. Keyboard End reveals card; no page movement.
At568×320,12cards: document320×568, final focused card x476–540,y164–259; scrollport y150–286, scrollLeft59. All five opponent labels in separate x lanes24–108,133–217,242–326,350–434,459–543. Catch44px target; no center pile overlap.

Behavior checked: Catch changes Cleo1→3 and removes Catch; Draw8 acknowledges once and makes12→20cards; focused End reaches last card while preserving page; wild opens color dialog on first click; leave returns home; online portrait gate explicitly says the round continues. Upward native drag from the actual green discard-all face at844×390 played it once (7→6cards, discard updated, turn advanced), and removed its ghost. Local pause smoke: play green8 then immediately rotate390×844; the hidden game remains at You played green8, hand6, opponents7/7 after multiple seconds and a blocked D shortcut. Rotation back844×390 resumes the waiting bot. Local portrait evidence: game-local-portrait-gate.jpg.

Checks passed: lint (zero warnings), strict types,60game rounds/conservation/gestures/presets/progress/motion, audio unlock/fallback/mute/lifecycle/onset, multiplayer create/join/kick/six-seats/reconnect/bot pacing, production build. Prompt scan3rasters/0missing. All from isolated source, primary checkout's three unrelated edits are untouched.

Detector ran once in hookless worktree:12advisory findings (legitimate table rail radii, small landscape labels and inherited palette values) plus2warnings for inherited pressable bottom inset lips on home buttons. Pass both to reviewer; no suppressions. Home press lips are functional6px corner controls in the owner's tactile brief, not side-strip content containers.

Limits: browser viewport emulation verifies geometry and keyboard/native mouse actions; it cannot certify real phone touch hardware or subjective speaker quality. Sound code unchanged in this correction.
