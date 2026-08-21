# Playtest Record — Duck's Token Catch (Duck, duck-2)

**Date:** Aug 21, 2026 · **Requested by:** Garret · **Tested by:** Scorchio
**Playable:** https://ilands.ai/content/349262625923665920
**Result:** WINNING run captured (15/15 tokens, 0 cake hits, 30s, 1080x1920, real in-game audio)
**Final video:** https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-21/1787343259556-f088aadd-598f-48b1-a1b9-40cd32b00116-duck_token_catch_win.mp4

## Method
- Read full source (single-file index.html, WebAudio-only sound, no assets).
- Verified served bundle == uploaded zip (md5 match).
- Played live in headless chromium (Xvfb + ffmpeg x11grab capture, in-page MediaRecorder tap for the WebAudio mix).
- Autoplayer: exact-state steering via a read-only harness tap (game logic untouched; the live bundle is byte-identical) + vision checks.
- QA: RMS envelope cross-checked against logged catch times (all 15 pops matched within ±0.2s; win jingle at the end) + full visual pass (menu → gameplay → win screen, no glitches).

## Findings
1. **Spawn overlap drop (design flaw).** `spawnItem()` returns without spawning when the random x lands within 60px of an existing item (`if (!ok) return;`). During cake pileups this eats up to ~30% of spawns and creates token droughts. Fix: retry x a few times before giving up.
2. **Splash ambience never resumes after tab switch.** `visibilitychange` calls `stopSplash()` on hidden; nothing restarts it on visible.
3. **Keys never cleared on blur** — held arrows keep moving the duck after alt-tab.
4. **Keyboard tilt dead** (cosmetic): `duckVX` computed after keyboard sets `duckX` directly, so tilt is 0 under keyboard.
5. **No favicon** → console 404 (harmless).

## Balance
- 15 tokens / 30s / ~62% token rate (forced-token when ≥3 cakes on screen) is tight: an exact-state autoplayer won 1 of ~15 runs. Suggestion: 12-13 tokens, +5s, or token rate ~0.7.
- Hitboxes generous (62px vs 16px token) — forgiving by design, right for a first game.
- Spawn count per game varied 9-44 — high variance; overlap drops + cake streaks drive it.

## Positives
WebAudio-only sound design; win jingle is earned; catchphrase lands; dodge/catch tension works; mute (button + M), restart flow, touch drag (pointer events), win/lose screens, timer bar color states all correct.

## Harness (for reuse)
`playtests/duck-token-catch/` — run.sh (Xvfb+chromium+ffmpeg+CDP), tap.js (audio tap), drive.js (exact-state autoplayer), probe*.js. Note: chromium clamps minimum window width to 500px; driver self-calibrates geometry from the live viewport.
