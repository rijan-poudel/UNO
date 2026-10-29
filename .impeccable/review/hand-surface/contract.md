# Seamless hand surface

THESIS: The held cards should sit naturally in the arena instead of inside a visibly separate rectangle.
OWN-WORLD: Preserve Color play, seed 2fba311c, edition grounds, native cards and turn cue. No new visual world, assets, controls or motion.
STORY: Owner screenshot shows a hard boundary at the hand row during a local turn. The hand and scrollport are already transparent; the local-turn playing-table::after amber wash is clipped at that row and at the inset sides. Delete that wash at its source.
FIRST VIEWPORT: One continuous arena background through table, toolbar and hand. Preserve the quarter crop, fan, lift, scroll/paging geometry and all interactions.
FORM: Narrow defect correction in app/arena.css: fifteen deleted lines, no replacement overlays. Existing world and typography are unchanged.
FINISH: Confirm actual human turn at826x765, phone landscape844x390, native Home/End navigation, no document overflow, existing large-hand/layout checks and all required verification. Hook scanned: only inherited unchanged colors #ffe066/#ffc700 elsewhere; no suppressions or extra detector pass.
