## verdict

1. Resolved — The selected Wild is visibly raised and fully identifiable in the desktop, 390px, 320px and 688px hand captures. The dock reads “Play Wild”; source preserves selection visibility on selection/sort/resize and names the card if manually scrolled away.
2. Resolved — The captured selected-hand hint agrees with Play. Source now prioritizes pending state and legal selection (including jump-in) before waiting, and handles the post-draw state before an illegal inspection; the previous misleading Draw and mismatch messages are removed from those states.
3. Resolved — Every updated hand capture shows dark ink on the lime Play action. The final scoped rule specifies #202b12 on #d8ed82, approximately 11.55:1 contrast.
4. Resolved — Phone home places secondary setup/join links beneath the primary choices. Their action order now agrees with the DOM order instead of preceding the illustration and primary choices visually.
5. Resolved — Desktop and phone setup visibly group “Your name” with its input. The field is one wrapper with an 8px internal grid gap, removing the detached page-grid arrangement.
6. Resolved — DESIGN.md now records the authorized contextual dock, named Play action, selection visibility, updated entry/setup/room flow and grouped name field. The sidecar includes the contextual dock and revised field; the old duplicate-Draw prohibition is replaced and intentional token reconciliation is documented.

## remaining

Clear. All 12 recaptures are valid. No material regressions observed in the fix batch. Ship covers the scored fixes, not the whole surface. Subjective audio quality remains unassessed.

disposition: ship
