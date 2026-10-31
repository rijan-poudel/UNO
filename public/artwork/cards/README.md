# Card artwork

- `shuffle-hands.png`: genuine printed illustration extracted directly from Mattel’s Classic/Shuffle instructions. Its luminance filter is applied only by the shared renderer.
- `color-roulette.webp`: source-informed, AI-cleaned and recolored derivative from Mattel’s No Mercy instructions. Four complete faces retain opaque yellow, blue, green and coral fills and transparent surroundings. It is not an unmodified original print.

Each asset retains provenance in PNG metadata or the adjacent WebP JSON sidecar, plus an `.origin.txt` history. Exact cleanup/recolor prompts are included. No generation or visual asset edits occurred during production integration. The standalone design lab was retired after these faces moved into `UnoCard`.

Roulette is delivered as lossless WebP: identical decoded RGBA pixels to the original PNG, about 34% less transfer. Its exact recolor prompt is retained in the adjacent WebP JSON metadata sidecar; extraction and edit lineage stay in the origin record.

The former PNG URL permanently redirects to the WebP so cached clients keep working.
