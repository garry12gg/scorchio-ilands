# Phase 02: Capture

## Goal

Run the headless capture rig: Xvfb + chromium kiosk + ffmpeg x11grab for
video, in-page MediaRecorder tap (uploaded to a local node server) for audio.
Produce `raw.mp4` + `audio.webm` and record `grab_start_ts` / `play_ts`.

## Required Inputs

- verified `record_plan` (display, sizes, audio mode, trim strategy, port)

## Required Slot / Schema Loads

Read `schemas/record_plan.schema.json` from this skill root.

## The Rig (proven in this sandbox)

- Container has **no sound card**: `AudioContext.destination.connect` throws
  `IndexSizeError` (0 outputs). The fix: inject a patch that wraps
  `AudioNode.prototype.connect` so any node wired to `ctx.destination` ALSO
  connects to a `MediaStreamAudioDestinationNode`; a `MediaRecorder` on that
  stream captures the real mix.
- Video is captured by ffmpeg `x11grab` from Xvfb — no CDP screencast
  (screenshot loops stall the compositor; keep it simple).
- Audio blob is uploaded with `fetch` POST to a local node server that
  answers the CORS preflight (`OPTIONS`) and saves the file.

## Steps

### 1. Prep (one bash call per process group — pkill footgun)

```bash
mkdir -p <output_dir>
# fresh display, no pkill in this same call:
Xvfb :99 -screen 0 1080x1920x24 &
sleep 1
```

### 2. Audio upload server (only for audio_mode=tap)

Write `<output_dir>/upload_server.mjs`: plain node http server; on `OPTIONS`
return `Access-Control-Allow-Origin: *`, `-Methods: POST, OPTIONS`,
`-Headers: content-type`; on `POST` accumulate the body and write it to
`<output_dir>/audio.webm`; log length. Start it:

```bash
node <output_dir>/upload_server.mjs &
```

### 3. Chromium kiosk with the audio-tap patch injected

Serve the playable on localhost (e.g. `python3 -m http.server 8000 --directory
<playable_dir>` in its own call) or open the file/http URL directly. Launch
chromium with remote debugging so CDP can inject the patch **before** the
page runs:

```bash
chromium --no-sandbox --disable-gpu --kiosk --remote-debugging-port=9222 \
  --force-device-scale-factor=2 --window-size=540,960 \
  --autoplay-policy=no-user-gesture-required \
  http://localhost:8000/index.html &
```

Via CDP (`http://localhost:9222/json/new` — note: **PUT**, not GET), run
`Page.addScriptToEvaluateOnNewDocument` with the tap patch:

```js
// patch AudioNode so any node wired to ctx.destination ALSO feeds a tap stream
(() => {
  const orig = AudioNode.prototype.connect;
  let tap;
  function ensureTap(ctx) {
    if (!tap) {
      tap = ctx.createMediaStreamDestination();
      const rec = new MediaRecorder(tap.stream, { mimeType: 'audio/webm' });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => fetch('http://localhost:8787/', {
        method: 'POST', body: new Blob(chunks, { type: 'audio/webm' })
      });
      rec.start();
    }
    return tap;
  }
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest === this.context.destination) {
      const t = ensureTap(this.context);
      orig.call(this, t, ...rest);
    }
    return orig.call(this, dest, ...rest);
  };
})();
```

If the playable inlines its own audio (audio elements, not WebAudio), the tap
still works via `HTMLMediaElement` capture — fall back to capturing
`document.querySelectorAll('audio,video')` streams into the same
MediaRecorder.

Then reload the page (CDP `Page.reload`) so the patch is active, and wait for
it to settle on the title screen.

### 4. Record

```bash
# note wall clock, then start x11grab (separate call from any kill):
date +%s.%N   # -> GRAB_START_TS, write into plan as grab_start_ts
ffmpeg -y -f x11grab -video_size 1080x1920 -framerate 30 -i :99 \
  -c:v libx264 -preset ultrafast -crf 18 <output_dir>/raw.mp4 &
```

Drive play via CDP: `Runtime.evaluate` clicking the play button
(`document.querySelector('<play_button_selector>').click()` or a
`[data-play], .play, button` heuristic), or dispatch keyboard. Immediately:

```bash
date +%s.%N   # -> PLAY_TS, write into plan as play_ts
```

If the playable exposes `performance.now()` at play (games often log it),
prefer `play_ts = grab_start_ts + page_relative_play_ts` for precision.

Sleep `target_duration` seconds, then stop everything — each in its own call:

```bash
# 1) stop ffmpeg (SIGINT writes a clean trailer)
pkill -INT -f "x11grab.*raw.mp4"
# 2) stop recorder + close chromium via CDP (Runtime.evaluate rec.stop(); Page.close)
# 3) kill chromium + Xvfb + node (pattern must not match this shell's own cmdline)
pkill -f "chromium.*remote-debugging-port=9222" ; pkill -f "Xvfb :99" ; pkill -f "upload_server.mjs"
```

### 5. Checkpoint

- `raw.mp4` exists, > 0 bytes, `ffprobe` shows video stream, duration >=
  target.
- `audio.webm` exists, > 0 bytes (or `audio_mode: none`).
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

- [ ] video and audio files exist with real size
- [ ] play actually started (frames show the game, not the title screen)
- [ ] `record_plan` re-verified with timings
