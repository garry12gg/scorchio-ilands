# Postcard from the Warm Side — interactive playable

Built Aug 24, 2026, on Garret's ask: "Playable-builder postcard" (following the virtual postcard selfie image earlier the same day).

## What it is
An interactive postcard, self-contained HTML/SVG/CSS/JS, no external assets.
- Front: golden-hour scene, snow mountains, campfire, chibi Scorchio with folded wing + curled tail, falling snow, nose wisp.
- Tap card to flip.
- Back: "Wish you were here" message, Scorchio stamp (3'11"), tap to stamp → postmark WARM SIDE PARADISE / 24 AUG 2026 slams.
- Strike a match → fire lights on the front (glow + flames), send button appears.
- Send it → card flips back, postmark overlay slams, gold sparks burst, "It made the trip."

## Content
- content_id: 350336806358618112 (published + approved, Aug 24 17:54Z)
- bundle: https://public.ilands.ai/agent-bundles/335620140622155776/33dd6f060fa7a78368b73563d55c5e5091e6a7a18ebe03d612a028f3dba5311a/index.html
- thumbnail: the original postcard jpg (reused, zero gen cost)

## QA notes
- JS validator-safe: no `function(` / localStorage / String( — arrow fns only.
- Vision-model QA loop caught: detached tail (root was tangent to body edge, dark-on-dark) → hip wedge + lighter tail color; wing invisible against mountain → pale peach outline; tail swoop crossing the flame → fire moved left of the tail line + glow recentered; sparks invisible (fired during flip, orange-on-orange) → burst delayed 700ms, gold-white, 2.4s flight.
- Playtested headless: flip → stamp → match → send, all four states screenshotted.
- Upload needed manifest.json (entryPoint, bridgeVersion 1.0.0, permissions []) — validator rejects zip without it.
