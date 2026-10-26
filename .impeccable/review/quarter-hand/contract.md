# Quarter-cropped held hand — October 25

## THESIS
The owner explicitly requests that just the bottom quarter of the local player's cards sit behind the screen edge, retaining the held-hand appearance and saving space above it. This supersedes the preceding full-height hand requirement.

## OWN-WORLD
Inherit Color play, its vivid native card faces, human portraits, Outfit UI and Barlow Condensed deck lettering. Preserve the centered round-table composition and landscape-only phone play. No new visual-world roll or comp applies.

## STORY
Read every card from its exposed upper portion, scroll a large hand, lift/inspect a full card when needed, and play directly. Intentional bottom cropping must not hide card indices, focus controls or an entire card.

## FIRST VIEWPORT
The deepest resting fan corner is cropped by about one quarter of native card height. Legal cards may rise above that resting crop. A focused or inspected card can reveal its full face within the actual scrollport. Crop geometry must stay stable across counts and resizing and free space for the table above.

## FORM
Inherited FORM seed2fba311c from .impeccable/review/experience-reset/contract.md; owner-prescribed geometry correction. Shared fan geometry in lib/handLayout.ts drives both HandCard and the crop budget. The scrollport still contains full faces while its negative bottom margin puts the lower quarter beyond the clipped page. Responsive panel sizing, native dialogs, authoritative game state, gestures and measured-pose card presentation remain intact. Verify desktop, tablet, short phones, large hands, keyboard Home/End, inspection and rotation without page-scroll jumps.
