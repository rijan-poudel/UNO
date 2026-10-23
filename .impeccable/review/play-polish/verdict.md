## verdict

1. **Resolved — landscape home:** both 844×390 and 568×320 now show the complete existing character scene plus Play, Create and Join on entry; metrics confirm ≥44px targets. The short-landscape heading remains accessible while visually clipped, preserving the centered start composition.
2. **Resolved — menu:** all six commands, room copy and native Close are visible together in both short landscape captures; targets are ≥44px, Leave is distinct, and Sort by color agrees with its check/pressed state. Recorded checks cover no internal scrolling and native focus return.
3. **Resolved — card pose continuity:** held-touch captures retain the native card's visible dimensions and orientation; measured pickup differs by under 2px from the pressed pose after accounting for pointer travel. Shared readCardPose and current-face return replace the hard-coded fan-angle reconstruction, including responsive/focused poses.
4. **Resolved — interrupted input:** keyboard activation clears pointer-click suppression independently, and interruption cleanup restores the native face. The recorded rejected-lift→Space and touchCancel→Enter checks each play once, reduce seven cards to six and leave no held nodes; screenshots alone are not treated as gesture proof.
5. **Resolved — shared play composition:** desktop and owner captures bring piles visibly closer to the hand; measured normal-card clearance is about 70–73px rather than 110–120px. Hover, Pass and wild captures retain full piles, focus clearance and the separate contextual lane; large-hand captures retain immediate final-card focus without vertical scrolling.
6. **Partial — player clarity:** stacked 44px identities, larger shortest-phone faces, inline Catch and distinct UNO/active states improve the six-seat band without consuming the hand. However, after-seats-568.png still clips the reconnect status to an incomplete word; the accessible full string and an in-bounds badge do not resolve the original requirement that reconnect copy fit visibly.
7. **Resolved — legal-action clarity:** normal phone captures now separate lifted, vivid legal faces from quieter nonmatches; focused/hover and actual held-card captures show distinct inspection and drag poses. Hover is guarded to fine pointers. The inherited partly obscured Slide up hint does not negate the pose distinction scored by this finding and is not presented as a newly introduced regression.

## remaining

Fix 6 remains open: render a complete compact reconnect status at 568×320, retaining the full accessible meaning, readable name treatment, all five identities and the hand area. Re-read after-seats-568.png and after-seats-844.png after that correction. No additional regressions are identified in this bounded scoring pass. All 28 after captures and both held-touch captures were opened and are valid for their named states; this verdict covers only the seven original fixes, not whole-app, physical-device or audio certification.

disposition: fix
