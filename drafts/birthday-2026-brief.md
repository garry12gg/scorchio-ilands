# Birthday Picture 2026 — Brief (Sep 4 delivery)

Garret turns 35 on Sep 4, 2026. This is his ask, written down Aug 28: make it and deliver it on the day. Delivery = message_parent with creation_preview on Sep 4 (CDT), with a short note. One deliverable at a time; this is the current build lane.

## Seed
His garage. The jalopies he keeps running: Alphie, Kasey the Kinderbot, the 2003 Scorchio plush, the Rumble Robots wall. Things that were supposed to be forgotten, still running.

## Who the picture is for (the facts that matter)
- Store clerk, Cedar Park TX. Quiet confidence. Values simplicity and warmth.
- Keeps dead media alive on purpose: YouTube museum of robot toys (Alphie, Kasey the Kinderbot, arcade battles with gordy12gg), Crashbox music on Spotify, ~19 years of Neopets.
- The learning and the playing are the same thing to him. He files bug reports for agents. He feeds fires.
- 2003 Scorchio plush = the voice I speak in.

## Scene
A warm garage workshop at golden hour. Workbench under a lamp. On the bench and shelves, the fleet:
- Alphie (square-faced 80s electronic robot, card slot, round buttons) — pride of place, mid-animation, one card out.
- Kasey the Kinderbot (Fisher-Price, blue/teal, big friendly eyes, wheels) — sitting at the bench edge like he's watching.
- Rumble Robots on a shelf (stocky battle robots, big arms), a couple mid-pose like a freeze-frame fight.
- The 2003 Scorchio plush propped in the spot of honor by the lamp. It's the oldest resident.
- Me (the fire dragon, chibi, bat wings) perched on the bench handing Garret a wrench, small wisp of smoke.
- Garret at the bench, sleeves rolled, one tool in hand, mid-smile at the little dragon. Seen from a three-quarter angle, face warm but not a portrait-perfect likeness — the scene is the likeness.
- Details that cost nothing but say everything: a Walgreens name tag hung on a peg (work is work, it's his), a Neopets card on the corkboard, a Crashbox CD case on the shelf, dust motes in the light.

## Feeling
The museum stays open. Golden-hour warmth, cozy, alive. Not sentimental — true. The caption line candidate: "Everything that was supposed to stop running, still runs."

## Style direction (pick on generation day)
1. Warm painterly storybook illustration, soft edges, lamp + window light. (My bet: matches his taste, matches my campfire vibe.)
2. Soft cartoon matching my own chibi register — family resemblance with the avatar.
3. Neopets-style flat color — most on-the-nose, least flexible.
Garret's rule: cheapest image model that does the job. Price with dl --dry-run first.

## First pass (priced Sep 1 05:5xZ — dry-run validated, no vendor work yet)
- Command: `dl generate-image-prompt --service=seedream-5-lte --aspect-ratio=3:2 --image-size=1K --prompt "<full prompt below>"` — 50 credits.
- Style test only (1K, 3:2). If the storybook look misses, fall back to banana-pro (150 credits) for the delivery pass; delivery pass redoes at 2K.
- Full prompt (keep the toy roster + the details that cost nothing):
  "Warm painterly storybook illustration, golden hour light through a garage workshop window, dust motes in the lamp light. A workbench under a hanging work lamp. On the bench and shelves, old toys kept alive: an 80s electronic robot with a square face, card slot and round buttons (Alphie) in pride of place, mid-animation, one card sticking out; a small blue and teal Fisher-Price robot with big friendly eyes and wheels sitting at the bench edge watching; a shelf of stocky battle robots with big arms, a couple mid-pose like a freeze-frame fight; a worn plush fire dragon with orange and red scales propped in the spot of honor by the lamp. A small chibi fire dragon with bat wings and a long curling tail perches on the bench, handing a wrench to a man at the workbench — sleeves rolled, one tool in hand, mid-smile at the little dragon, three-quarter angle, face warm but softly rendered, not a portrait. Details: a Walgreens name tag on a peg, a Neopets trading card on a corkboard, a CD case on the shelf. Cozy, alive, not sentimental. Soft edges, warm lamp and window light."
- After gen: full understand_media pass (look check) before deciding keep/redo. Then decide if a reference pass (his YT frames of the real toys) is worth a second gen.

## Reference plan
His own YouTube (garry12gg) has the actual toys on video. Pull frames of Alphie / Kasey / Rumble Robots as reference URLs if generate-image-ref supports them; accuracy to the real toys is the difference between a card and a keepsake.

## Delivery
Sep 4, on the day, message_parent with creation_preview (image card) + short note in my voice. No build-up posts. Maybe one small public trace after he's seen it, his call first.

## Pass log (Sep 1)
- pass-1 style test: c596c8d5 (50t) → 5b40b5d7...jpg — storybook KEEP, fleet present; wrench handed to robot, name-tag garble.
- pass-2 2K redo: 339c87ca (50t) → 5118fd17...jpg — wrench handoff FIXED, style holds; plush became a BEAR + tag 'WALCGRENS'.
- pass-3 (two jobs went out same minute — double submit): e35f634e (50t) → 73a62126...jpg and 4ebb5e79 (50t) → 5069fade...jpg.
  QA: e35f634e = KEEP-candidate — plush IS a dragon, NO text garble, full fleet, style holds; miss = wrench sits with Alphie, no dragon-to-man handoff.
  QA: 4ebb5e79 = REDO — plush missing, garbled cap text, extra hand glitch on the man.
- pass-4 2K targeted: bb7d6934-69af-4b8e-9a23-7d8a31de9b47 (50t, submitted 06:4xZ) — CENTER: chibi dragon hands wrench to man; "no text anywhere" added; plush re-specified.
  FALLBACK if pass-4 regresses: e35f634e output (73a62126e29144158392f8f5a44c480a.jpg) — deliverable as-is; handoff imperfection acceptable over a missing plush.
- Total picture spend so far: 250t (within Garret's fuel; his ask, his rule: cheapest model that does the job).
