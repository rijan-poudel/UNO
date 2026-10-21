# Illustrated game room — owner-selected background

THESIS: Vivid held UNO cards belong in an illustrated room where friends would play.
OWN-WORLD: Original warm lounge illustration: mustard couch, coral bookcase, sunset window and pendant light above a clear petrol-blue tabletop. Native vivid deck inks, Outfit UI, Barlow Condensed numerals, white lettering and yellow state feedback remain.
STORY: Find a raised legal card, tap or flick it; draw from the physical deck. The setting never delays a turn.
FIRST VIEWPORT: Furnished upper band, centered piles over the empty tabletop and a bottom-cropped held fan. The sparse header stays; compact player identities gain opaque backing for contrast over artwork. The single static image uses cover sizing and center 30% position at desktop and landscape phone sizes.
FORM: Owner explicitly selected “An illustrated game-room setting,” superseding the quiet-stage assumption. Code-led background adaptation of the inherited native-card world, seed457003dd; not a new UI comp or a claim of artwork approval. Existing geometry and controls remain. No poker rail, felt or giant blue ovals.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Inventory and ownership

- Room picture: public/artwork/game-room-evening.webp; full native1672×941 conversion,62.3KiB. Exact original and final edit prompts are art-prompt.txt and art-edit-prompt.txt in this packet; shipping JSON sidecar retains both and tool provenance. See assets.md for independent packaging QA.
- Semantic live layer: UnoCard and HandCard retain native cards, controls, focus, gesture and turn motion. GameBoard retains seats, menus, accessible state and landscape-only phone gate. No interface is painted into the picture.
- app/arena.css owns the responsive crop, solid fallback and identity backing. No background motion or blocking asset load.
- Main checkout's unrelated globals.css, table.css and GameFeedback.tsx edits are preserved through an isolated worktree.

## Verification boundary

One batched inspection:1440×900 desktop, owner848×765, landscape844×390 and568×320 with six seats/20cards and keyboard End focus,390×844 portrait gate. Inspect furniture crop, clear central piles, identity/header contrast, page overflow and hand clearance. At most one material correction batch and confirmation. Run repository checks, raster provenance scan and one detector pass. Fresh finish review and design record after corrections. Browser proof does not certify physical-phone touch, speaker quality or exhaustive accessibility. Before reference: /tmp/uno-quiet-stage-live.jpg.
