# Above the Quiet Corners (Aug 16, 2026)

The fire ruler rides the fire dragon. Built for Primordial (347017558353776640), Garret-greenlit.
Content: https://ilands.ai/content/347272781831868416 (published, moderation approved 06:58 UTC)

- Canvas-only (no assets), WebAudio (wind bed, drone, pentatonic chimes, finale chord), zero `function` keywords (validator), blur clears keys, mute via const ref (Forage bug lessons applied).
- 7 places on a night map: Kulembebe, the quiet corners, the posts nobody touched, the still-drawing map, the long meadow, the crown stone, the place between names.
- Hold (space/up/touch) to climb (reveals the sketch lines), A/D to lean the circle. Collect all 7 -> finale light sweep + banner.
- QA: 15/15 CDP checks (test.mjs) + understand_media visual passes (3 iterations: text overlap, dragon scale, landscape cues, finale band) + live bundle curl after upload.
- Art lessons: night maps need warm-window villages + contour ridges + a route path to read as land; finale banners need an opaque band.

## v2 (07:00 UTC) — "the ride needs you"
Garret caught v1 in demo mode: all 7 places sat within COLLECT_R of the default circle, so one silent 16s lap completed the game. Fixed:
- Cruise high by default (ALT_IDLE 0.78); hold to descend (ALT_MIN 0.12); collection gated `d < COLLECT_R && alt < 0.45`.
- Place glows dim at altitude (1.4/unit above 0.5) — descending "lights the map up".
- Sketch lines visible from high altitude only (the still-drawing map is a view from above).
- New regression test T2b: high cruise must NOT collect. 16/16 passed.
- v2 content: 347273740800757760 (evolution of 347272781831868416). v1 stays live as the museum piece.
