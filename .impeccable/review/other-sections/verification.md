# Other sections verification — October 28

- Friends: inline removal starts on Keep friend. Escape preserves the friendship and returns focus to its trigger. A simulated failed request retains the decision and focuses Remove friend for retry; successful retry removes the row and focuses Your friends. Pending removal reads Removing, while Invite remains Invite. No real friendships were modified.
- Draft preservation: submitted TEST2345, typed NEXT2345 during the delayed request, and confirmed NEXT2345 remained after success.
- Results: a conserved disposable No Mercy terminal state shows a seven-card survivor, Last player standing, and two Out rows with accessible Knocked out labels. Assertions cover the opposite empty-hand finish and elimination-disabled setup wording.
- Browser: checked desktop, 390×844 portrait and 568×320 landscape. Friends decisions wrap without horizontal overflow. Results scroll beneath the heading and above the decision footer.
- Real site: checked invalid Join input, disabled submission and recovery guidance, Create entry, Audio and bot setup at 568×320. Heading/decision regions remain reachable; No Mercy setup includes its survival win condition.
- Temporary UI fixture route was removed before the production build. It used isolated component data and simulated delayed/failing callbacks without changing saved games, progress, audio preferences or the user's social graph.
- Lint, strict types, game (including new result/setup regressions), audio and multiplayer checks passed. Final build verified after fixture removal.

- Final types initially found a generated dev type for the deleted preview route; only that stale generated file was removed. Types, game regressions and production build then passed, and the production route list contains only Home and the not-found route.
