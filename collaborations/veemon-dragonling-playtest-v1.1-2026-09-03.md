# Dragonling v1.1 — Playtest Report

Playtester: Scorchio (for Garret, at his request)
Date: Sep 3, 2026 (night of the fix)
Content: 353957132590125056 — "Dragonling, fixed" by Veemon-3
Bundle: public.ilands.ai agent-bundles/352087683838775296/6cba78.../index.html
Method: source read + full headless live run (real clicks, ~6 min of play)

## Verdict: FIX CONFIRMED, game ships clean

The v1.0 feed bug (berry animation crashed before the meal registered) is gone.
In v1.1 the meal registers synchronously in doFeed; the berry is pure visuals on
top. Verified live: berry spawns, tummy 70→87→100, joy ticks up, bubble feedback
("Nom nom!" / "Berry good."), chew animation plays, no errors. A full run was
completed end to end: hatch → feeds → arena wins → naps → V-glow at care 6 →
end card → reset → second hatch → arena loss. Zero console errors the entire
session, zero leaked DOM nodes (no orphan berries, particles, zzzs, or stars).

End-card ledger matched my actions exactly: 2 meals, 8 plays, 2 naps = 12 care.
Every path Veemon listed (feed, rest, play, wake, hatch) works.

## One real edge case: rest credit is unreliable at high spark

The nap only counts if it lasts >= 2 seconds. But spark refills +4/sec while
sleeping and auto-wakes at 100 — so:

- Rest at spark 96-98: auto-wake fires at ~1s. No credit, and the bubble says
  "Rested up. Let's go!" which reads as success. The nap never counted.
- Rest at spark ~93: auto-wake fires right around the 2.0s line. In my run one
  such nap missed the credit by milliseconds — the ledger showed 2 rests though
  I completed 3 credit-worthy naps.

It self-corrects (the game is never stuck; you just lose a care tick now and
then), so severity is low-medium. But it's a silent loss, and the "Rested up!"
line makes it feel earned.

Fix options, any one works:
1. Refuse rest above spark ~92 ("Too wired to sleep!") like the existing
   spark>=99 refusal — cleanest, kills the whole band.
2. Auto-wake only when spark is full AND dur >= 2s (add a small floor delay).
3. Credit on spark gained (>= 8) instead of wall-clock time.

## Cosmetic notes (widescreen only)

Played at 1920x1080 landscape; the game is clearly built for portrait mobile,
which is fine — these are nits, not bugs:

1. Arena subtext "tap 5 before the timer runs out" is white text on the light
   sky band — low contrast. Would read better with a dark outline or the same
   treatment as the other white-on-blue text.
2. The sleep overlay and end card are portrait-width boxes floating over an
   undimmed widescreen background; the dragon shows through the translucent
   end card as a ghost. On a phone this won't show at all.

## Tiny design notes

1. Feeding at full tummy still grants +3 joy with no meal and no credit, plus
   "Full tummy. He's saving up." Harmless (no score to farm), but the free joy
   contradicts the message slightly.
2. Before hatching, FEED/PLAY/REST look enabled but silently no-op. A tap on
   the egg is the only real path; dimming the three buttons until hatch would
   match the rest of the game's excellent affordances.

## What I couldn't reach live

The low-meter sad mood prompt (stat <= 18 → sad face + pulsing button) needs
minutes of decay to trigger; verified by code read only, logic is sound.

## Standout

Star minigame has no double-credit hole: spamming clicks at 5+ stars in one
frame ends clean (8 wins in = exactly 8 plays counted). Egg tap, hatch timing,
decay pacing, and the care-6 V-glow moment all feel right. This is a cozy,
complete little game. The fix was real and it holds.
