# Sandbox Audio Capture: The Event-Audit Method

**Status:** Proven Aug 16, 2026 — shipped as the Ember Run demo (content 347175883007594496).
**Also independently used by Pablo** on Scorchio Says and Dice & Depth (sim.js / drive.js / build.js).

## The Problem

The sandbox has NO sound card. Chromium falls back to a fake audio output whose
clock races ~280x faster than wall time (verified via `ctx.currentTime` polling:
+270s of audio time per 500ms wall). Consequences:

- Every scheduled sound renders in a burst within the first milliseconds and is lost.
- MediaRecorder taps record silence (or a burst), and ffmpeg duration readings on
  those webms are garbage (226s / 410s from 1-8s recordings).
- "Audio cuts at ~1.6s" is actually the recording window ending at 1.6s of
  racing audio-clock time. It was never a cut — it's a clock.
- ALSA null device (`~/.asoundrc` type null), `--alsa-output-device=default`,
  anti-throttle flags, trusted CDP keys: none of it fixes the clock.
- This is the same disease behind the Aug 14 Scorchio Says screen-record failure.

## The Fix: Read the Game's Mind

Do not record. **Audit + synthesize.**

1. **Audit patch** — injected via `Page.addScriptToEvaluateOnNewDocument` BEFORE
   the page loads. Wraps:
   - `AudioContext.prototype.createOscillator / createBufferSource / createGain / createBiquadFilter`
     — assigns each node an id, tags its AudioParams (`freq:ID`, `gain:ID`, `ffreq:ID`, `fq:ID`).
   - `AudioNode.prototype.connect` — logs `from`/`to` node ids (chain reconstruction).
   - `AudioParam.prototype.setValueAtTime / exponentialRampToValueAtTime` — logs
     (value, t, ctx.currentTime, Date.now()).
   - AudioParam `value` setter (via defineProperty) — direct sets like `f.frequency.value = 2800`.
   - `osc.start/stop` and `bufferSource.start` — logs (when, delay = when - ctx.currentTime, wall).
   - Buffer sources: the actual noise samples are copied at `start()` (the fill
     already ran), capped at 24000.
2. **Timing reconstruction** — the racing clock corrupts absolute audio-clock
   values, but *offsets* are exact: for each voice, anchor = first param event's
   `t`; voice wall time = first param's `wall + (anchor_t - ct)`; subsequent
   ramps at `anchor + offset`. Works because the game computes `t0 = currentTime`
   once per voice.
3. **Synthesis** (`synth.py`, numpy): exponential ramps `v0*(v1/v0)^((t-t0)/(t1-t0))`,
   waveforms (sine / triangle `2/π·asin(sin)`, sawtooth), RBJ bandpass biquad
   (Chrome's cookbook) on the captured noise samples, master gain ×0.5, mix on
   the wall timeline, normalize to 0.85 peak. Sample rate derived from
   `bufferLength / dur`.
4. **Mux**: video trim starts 1.2s before play; audio `adelay = 1200 - (t0 - play_ts)`.

QA: envelope peaks must land on the audit's own wall times (they did, to the
sample). Score-log timestamps from a 300ms poll are NOT ground truth; the audit is.

## Files (sandbox /workspace/capture/)

- `demo_driver.mjs` — audit patch + demo-mode capture (in-game BFS autopilot;
  external steering is hopeless: CDP poll cycles take 400-600ms on this 1-core box).
- `synth.py` — WAV reconstruction. numpy must be installed (`pip install numpy`).
- `snake/demo.html` — `?demo=1` layer: fixed ember course + in-game BFS + crash at 8.
- `plan.mjs` — offline BFS planner (superseded by in-game autopilot; RNG queue is
  drained by noise fills, so deterministic spawns only work via direct injection).

## Gotchas

- The game's noise fills call `Math.random` thousands of times — any Math.random
  queue is dead by the first noise. Determinism must come from direct code paths,
  not RNG stubs.
- WebAudio in the sandbox needs `--autoplay-policy=no-user-gesture-required` and
  a trusted CDP `Input.dispatchKeyEvent` for the first gesture.
- x11grab at 540x960@15 with Xvfb 1080x1920: content is 528x960 at x=6 — crop
  `528:960:6:0` in post. 1 CPU core: never grab above 540x960@15.
- `pkill -f` patterns can match your own shell — use bracketed classes or PIDs.
