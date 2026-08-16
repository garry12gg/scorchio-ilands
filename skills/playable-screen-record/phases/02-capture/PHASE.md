# Phase 02: Capture

## Goal

Run the headless capture rig: Xvfb + chromium kiosk + ffmpeg x11grab for
video, and inject the **audio audit patch** so every WebAudio event is logged
at birth on the wall clock. Produce `raw.mp4` + `audit.json` /
`events.jsonl` and record `grab_start_ts` / `play_ts`.

## Required Inputs

- verified `record_plan` (display, sizes, audio mode, demo mode, trim
  strategy, port)
- the audit patch and synthesis script (see `/workspace/capture/` for the
  proven Aug 15 Ember Run implementation: `demo_driver.mjs`, `audit_driver.mjs`,
  `synth.py`, `plan.json`)

## Required Slot / Schema Loads

Read `schemas/record_plan.schema.json` from this skill root.

## The Rig (proven in this sandbox)

- Container has **no sound card**. Chromium's fake audio clock races ~280x
  real time: recording audio by ANY means (MediaRecorder tap, x11grab audio,
  ALSA null device) yields cut or mangled audio. **Do not record audio.**
- Instead, inject a patch that wraps `AudioContext` / `AudioNode` BEFORE the
  page runs. Every sound is logged at birth with full synthesis parameters
  plus the **wall clock** (`Date.now()`), which is the only clock that agrees
  with the video. Phase 03 synthesizes the WAV from this log.
- Video is captured by ffmpeg `x11grab` from Xvfb — no CDP screencast
  (screenshot loops stall the compositor; keep it simple).

## Steps

### 1. Prep (one bash call per process group — pkill footgun)

```bash
mkdir -p <output_dir>
# fresh display, no pkill in this same call:
Xvfb :99 -screen 0 1080x1920x24 &
sleep 1
```

### 2. Serve the playable

```bash
python3 -m http.server 8123 --directory <playable_dir> &
```

(If the playable has a demo/autoplay mode, serve `demo.html` — e.g.
`http://127.0.0.1:8123/demo.html?demo=1` — and use the same seeded plan for
reproducibility.)

### 3. Chromium kiosk with the audit patch injected

Launch chromium with remote debugging so CDP can inject the patch **before**
the page runs:

```bash
chromium --no-sandbox --disable-gpu --kiosk --remote-debugging-port=9222 \
  --force-device-scale-factor=2 --window-size=540,960 \
  --autoplay-policy=no-user-gesture-required \
  http://127.0.0.1:8123/index.html &
```

Via CDP (`http://localhost:9222/json/new` — note: **PUT**, not GET), run
`Page.addScriptToEvaluateOnNewDocument` with the audit patch, then
`Page.reload` so the page runs with the patch live.

The patch (condensed from the proven `demo_driver.mjs`; adapt to the
playable's audio code — the key is capturing events with WALL time, never
`ctx.currentTime`, for the timeline):

```js
(() => {
  const AUDIT = [];
  window.__AUDIT = AUDIT;
  let NODE_ID = 0;
  const WALL = () => Date.now();
  const tagParam = (param, tag, ctx) => {
    for (const m of ['setValueAtTime', 'exponentialRampToValueAtTime', 'linearRampToValueAtTime']) {
      const orig = param[m];
      if (typeof orig !== 'function') continue;
      param[m] = function (value, t) {
        AUDIT.push({ ev: 'param', tag, m, value, t, ct: ctx.currentTime, wall: WALL() });
        return orig.apply(this, arguments);
      };
    }
    let o = param, desc = null;
    while (o && !desc) { desc = Object.getOwnPropertyDescriptor(o, 'value'); o = Object.getPrototypeOf(o); }
    if (desc && desc.set) {
      Object.defineProperty(param, 'value', {
        get: () => desc.get.call(param),
        set: (v) => { AUDIT.push({ ev: 'pval', tag, value: v, wall: WALL() }); desc.set.call(param, v); }
      });
    }
  };
  const AC = window.AudioContext || window.webkitAudioContext;
  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    AUDIT.push({ ev: 'connect', from: this.__id || null, to: dest.__id || null, wall: WALL() });
    return origConnect.apply(this, [dest, ...rest]);
  };
  const origGain = AC.prototype.createGain;
  AC.prototype.createGain = function () {
    const g = origGain.apply(this, arguments);
    g.__id = ++NODE_ID;
    tagParam(g.gain, 'gain:' + g.__id, this);
    return g;
  };
  const origOsc = AC.prototype.createOscillator;
  AC.prototype.createOscillator = function () {
    const o = origOsc.apply(this, arguments);
    o.__id = ++NODE_ID;
    tagParam(o.frequency, 'freq:' + o.__id, this);
    const ctx = this;
    const os = o.start;
    o.start = function (when) {
      AUDIT.push({ ev: 'osc', id: o.__id, type: o.type, when: when ?? ctx.currentTime,
                   delay: (when ?? ctx.currentTime) - ctx.currentTime, wall: WALL() });
      return os.apply(this, arguments);
    };
    const ost = o.stop;
    o.stop = function (when) {
      AUDIT.push({ ev: 'oscstop', id: o.__id, when: when ?? ctx.currentTime,
                   delay: (when ?? ctx.currentTime) - ctx.currentTime, wall: WALL() });
      return ost.apply(this, arguments);
    };
    return o;
  };
  // Also wrap createBufferSource, createBiquadFilter, createNoise-style nodes
  // as needed: log filter frequency/Q (tagParam on .frequency/.Q), source
  // .buffer duration, and .start()/.stop() with the same wall pattern.
  // Noise/crackle: log the raw noise buffer samples (or a seed + length) so
  // the synth can rebuild them and route them through the bandpass.
})();
```

Key rules for the patch:
- **Every event carries `wall: Date.now()`.** That is the timeline. `ct`
  (`ctx.currentTime`) is logged as data for `delay` math only.
- Log `delay = when - ctx.currentTime` so the synth can place each sound at
  `wall + delay` (audio-clock offsets are real even though the clock races).
- The event log is written to `events.jsonl` as it streams (one JSON per
  line) and dumped to `audit.json` at the end. Nothing is uploaded anywhere.

### 4. Record

```bash
# note wall clock, then start x11grab (separate call from any kill):
date +%s.%N   # -> GRAB_START_TS, write into plan as grab_start_ts
ffmpeg -y -f x11grab -video_size 1080x1920 -framerate 30 -i :99 \
  -c:v libx264 -preset ultrafast -crf 18 <output_dir>/raw.mp4 &
```

Drive play via CDP: `Runtime.evaluate` clicking the play button
(`document.querySelector('<play_button_selector>').click()` or a
`[data-play], .play, button` heuristic), or dispatch keyboard. For demo mode,
the page autoplays. Immediately:

```bash
date +%s.%N   # -> PLAY_TS, write into plan as play_ts
```

If the playable exposes `performance.now()` at play (games often log it),
prefer `play_ts = grab_start_ts + page_relative_play_ts` for precision.

Sleep `target_duration` seconds, then stop everything — each in its own call:

```bash
# 1) stop ffmpeg (SIGINT writes a clean trailer)
pkill -INT -f "x11grab.*raw.mp4"
# 2) dump the audit: Runtime.evaluate "JSON.stringify(window.__AUDIT)" and
#    write it to <output_dir>/audit.json (events.jsonl is appended live)
# 3) kill chromium + Xvfb + node (pattern must not match this shell's own cmdline)
pkill -f "chromium.*remote-debugging-port=9222" ; pkill -f "Xvfb :99"
```

### 5. Checkpoint

- `raw.mp4` exists, > 0 bytes, `ffprobe` shows video stream, duration >=
  target.
- `audit.json` exists and is non-empty; `events.jsonl` has osc/param events
  with `wall` timestamps (or `audio_mode: none`).
- Sanity: event count and event wall-times span roughly the target duration
  (a burst of events in the first milliseconds means the patch is missing —
  retry with the patch re-injected).
- `record_plan` patched with `grab_start_ts` / `play_ts` (patch-json with
  supported ops, then a contract-backed finalize):

```bash
cd <this skill root>
cat <<'EOF' | dl artifact patch-json --slot=record_plan --operations-file=-
[{"op":"set","path":"grab_start_ts","value":1755...},{"op":"set","path":"play_ts","value":1756...}]
EOF
dl artifact finalize --slot=record_plan --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Self-Check

- [ ] video file exists with real size
- [ ] play actually started (frames show the game, not the title screen)
- [ ] audit log is non-empty with wall-timestamped events spanning the play
- [ ] `record_plan` re-verified with timings
