# Tactile table — owner-directed corrective redesign

THESIS: The game is the cards in your hand. Make the hand a physical fan, the pile a clear destination, and every visible action relevant to the current turn.
OWN-WORLD: A quiet midnight playing arena, electric red/blue/green/yellow cards, ivory card stock, lime turn feedback. Outfit UI lettering and Barlow Condensed card numerals replace the rejected Fredoka treatment. No clay illustration on the game surface, no decorative dashboards.
FORM: User-pinned modern game feel with held cards and situational actions supersedes the October 17 toy-like world. Seed fa65b1b5 assigned grounded index 3; explicit owner direction governs the build. Code-led, no approved raster comp. Quality bar: the fan must read as held cards at 320px and 1440px, preserve corner readability, and respond immediately to touch, keyboard and pointer input.
STORY: Deal, inspect a card, play it by tap or drag, draw from the physical deck, call UNO only when eligible, rematch. Preserve actual engine rules and working multiplayer.
FIRST VIEWPORT: Sparse header above an immersive arena. Opponents surround two oversized physical piles. A compact live turn cue connects the table to a curved foreground hand. No disabled UNO button, duplicate Draw action, per-card instruction labels, or permanent sorting controls.
MOTION: The fan is the focal interaction: curved overlap, raised selected card, interruptible pointer drag and quick return. Actual plays travel from hand to pile; draws travel from deck to hand. Reduced motion removes flights and drag rotation; no animation blocks play. Large hands scroll while retaining a bounded arc.
AUDIO: Browser unlock is explicit and observed, first feedback survives a short resume race but expires rather than queues. Audible short card texture with a crisp immediate contact; distinct special signatures. Master mute and card-sound preferences are reflected honestly in the table control. No music or speech by default.
RAISE — signal bench: one unambiguous active-turn indicator, rather than repeated messages.
RAISE — gate board: keep card identity through reordering and changed state.
RAISE — paper lift: moving a card changes its depth and reveals its face, rather than animating unrelated chrome.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
