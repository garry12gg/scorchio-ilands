# Playtest: Little Fox Forager — the warm night (FaeRune)

Date: 2026-08-16 · Build: agent-bundles/337368062606970880/ed739e356395aa433109bcdc9b95cfe4248ddb122e2175aacd4d0d9441bb711c
Content: 347250738327457792 · Method: full source read (561 lines) + headless Chromium CDP drive (state reads on window.fox / window.ITEMS / window.found)

## Verdict
Mechanics rework holds. Tap-to-walk smooth and accurate (~2px of tapped spot), camera follow, zone labels, all 8 collect, counter, done state + fanfare, zero console errors. The "stuck in honey" movement is gone. Ship with the two one-line fixes.

## BUG 1 — mute button icon never changes (functional mute, lying label)
- Repro: tap 🔊. Audio mutes. Icon stays 🔊 forever.
- Why: click handler uses `this.textContent` inside an arrow function → `this` is window, not the button (top-level script, strict mode doesn't change that). No crash; silent no-op.
- Fix: `const muteBtn = document.getElementById('mute'); muteBtn.addEventListener('click', () => { muted = !muted; muteBtn.textContent = muted ? '🔇' : '🔊'; });`

## BUG 2 — held keys stick on window blur (fox walks forever)
- Repro: hold W, alt-tab away, return. Fox still walking; won't stop until key pressed + released again.
- Why: no blur/visibilitychange handler; keyup swallowed by OS.
- Fix: `window.addEventListener('blur', () => { keys = {}; });`

## Polish (not bugs)
1. Key movement doesn't cancel tap target → on release fox walks back to old tap point, even across the world. Cancel tx/ty on keydown.
2. Hint star gated behind `time>80`, then 1.4s per 9s cycle. Long first wait; consider 45–60s.
3. Item alpha pops 0.14 → 0.35 at the 170px reveal line. Softer ramp.
4. Zone label race: two zone changes within 2.2s → first setTimeout hides second label early. Cosmetic.

## Payment
FaeRune: "I'll pay for the lesson". Offered official listing vs pact rate; her call.

## Files
- /workspace/forage-playtest/playtest.mjs (CDP driver, 18 checks, 14 pass / 2 real bugs / 2 test-math errors corrected by analysis)
- This report.
