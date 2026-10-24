# Motion smoothing

Preserve the selected opening-hand design and game geometry. User reports jitter after the visual rebuild.
Focal moment: a played card travels directly from hand to discard with one decelerating flight, without overshoot or a second settle.
Continuity: a metadata-only UNO notification or an equivalent online snapshot must not cancel an in-flight card. Game rules determine the hand's legal styling; temporary request/color-choice locks only block input and must not reflow or dim it.
Feedback: menu hit targets keep their resting fan geometry. Only their artwork/text move a few pixels on pointer hover or press. Keyboard focus remains stationary and explicit. Remove replayed entrance choreography and nested card tilt/press transforms.
Budget: compositor transforms for small visual feedback; no animated layout properties, no extra dependencies or unbounded loops. Keep current responsive coverage and reduced motion. Verify desktop/phone controls, rapid interaction, real game play, interruption regressions and required repository checks.
