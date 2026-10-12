# hurt_right — motion QA

Verdict: **pass**, reviewed 12/10/2026.

- Identity/facing reference: `base-source.png`, the accepted right-facing scooter.
- Geometry reference: `references/layout-guides/hurt_right.png`.
- Generation: built-in GPT ImageGen; canonical sprite-gen prepare, component extraction, chroma cleanup, atlas composition, inspect and GIF preview.
- Four frames at 5 fps: neutral → forward lean/suspension dip → front-wheel rebound → neutral recovery. Runtime plays once per hit for 800 ms and holds the last frame if a delayed state update still reports stun.
- The first generated row was rejected for visible scale growth in the compression pose. The second row passed independent visual review of all four frames: anatomy, right-facing orientation, scooter identity and recovery remain consistent.
- Canonical extraction and inspect passed: exactly four non-empty frames; zero edge-contact pixels; zero chroma-adjacent pixels. No hand cutting, frame drawing or timing repair.
- Runtime `assets/scooter-hurt.png` is the composed atlas, byte-for-byte. `assets/hurt-animation.js` uses the manifest's source rectangles and 200 ms frame durations.
- Curation skipped per the user's existing preference to inspect directly in the game.

No walking/stride measurement was claimed; this is a stationary collision reaction, and race position remains server-owned.
