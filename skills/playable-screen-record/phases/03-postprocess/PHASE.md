# Phase 03: Post-Process

## Goal

Turn raw capture into the final MP4: trim to the play moment, recenter the
kiosk window, mux the recorded audio, encode, QA with ffprobe, and get a
persistent `video_url`.

## Required Inputs

- `raw.mp4`, `audit.json` (+ `events.jsonl`) from Phase 02
- `record_plan`: `play_ts`, `grab_start_ts`, `crop_geometry`, `pad_geometry`

## Steps

### 1. Compute the trim point

- `play_ts` strategy: `trim = play_ts - grab_start_ts` seconds.
- `pixel_detect` fallback (play button fills with a known color, e.g. orange
  `>= 50/256`): scan raw frames for the first matching frame:

```bash
ffmpeg -i raw.mp4 -vf "crop=16:16:634:322" -pix_fmt rgb24 -f rawvideo - \
  | python3 -c "
import sys
buf = sys.stdin.buffer
i = 0
while True:
    frame = buf.read(16*16*3)
    if len(frame) < 16*16*3: break
    if sum(1 for j in range(0, len(frame), 3) if frame[j] > 127 and frame[j+1] > 79 and frame[j+2] < 100) >= 50:
        print(i / 30.0); break
    i += 1
"
```

  The crop window `16:16:634:322` is an example — derive it from the actual
  play button location (screenshot the title screen first, locate the button).
- If capture started exactly at play, `trim = 0`.

### 2. Trim + recenter (re-encode, never `-c copy` — sync matters)

Portrait:

```bash
ffmpeg -y -ss <trim> -i raw.mp4 -vf "crop=1040:1920:20:0,pad=1080:1920:20:0:color=0x1a0f0a" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p trimmed.mp4
```

Landscape:

```bash
ffmpeg -y -ss <trim> -i raw.mp4 -vf "crop=1900:1060:20:20,pad=1920:1080:10:10:color=0x180d08" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p trimmed.mp4
```

If the kiosk window landed dead-center (check one extracted frame), skip the
crop/pad. `--force-device-scale-factor=2` + `window-size` gives crisp output
at the full Xvfb resolution.

### 3. Audio (audio_mode=audit): synthesize from the event log

The audit events are wall-timestamped, and `grab_start_ts` / `play_ts` are
wall-clock too — so the audio timeline agrees with the video **by
construction**. Synthesize the WAV (see the proven Aug 15 implementation
`/workspace/capture/synth.py` for Ember Run):

```bash
python3 synth.py <output_dir>/audit.json <output_dir>/soundtrack.wav
```

The synth must honor real WebAudio semantics:
- `exponentialRampToValueAtTime`: `v(t) = v0 * (v1/v0)^((t-t0)/(t1-t0))`
  (guard `v0=0` with a floor like WebAudio's `1e-4`); piecewise across
  consecutive param points.
- Biquad filters: RBJ cookbook bandpass (constant 0 dB peak gain), which is
  what Chrome's biquad implements.
- Noise/crackle: rebuild from the logged raw noise samples (or seeded
  generator) and route through the same bandpass.
- Sample rate 48 kHz, float→int16, wall offsets only.

Then trim the soundtrack to the same play window as the video:

```bash
ffmpeg -y -ss <trim> -i <output_dir>/soundtrack.wav -c:a pcm_s16le audio.wav
```

> Why not just record? The container has no sound card; Chromium's fake
> audio clock races ~280x, so any recorded audio cuts or drifts (the Aug 14
> failure). Events + synthesis is the only path that keeps sync.

### 4. Mux + encode final

```bash
ffmpeg -y -i trimmed.mp4 -i audio.wav -c:v copy -c:a aac -b:a 192k -shortest \
  -movflags +faststart final.mp4
```

### 5. QA

```bash
ffprobe -v error -show_entries stream=codec_type,width,height,avg_frame_rate \
  -show_entries format=duration -of json final.mp4
```

- duration within ~1s of `target_duration`
- width/height even and matching orientation (1080x1920 / 1920x1080)
- audio stream present when `has_audio` will be true
- extract 2–3 frames and glance at them (built-in `understand_media`) to
  confirm the playable actually rendered

### 6. Persist

Upload the final file so it gets a permanent URL:

```bash
upload_file /workspace/recordings/<slug>/final.mp4
# or: dl artifact upload --file=... if the platform command is available
```

Record the returned `video_url` for Phase 04.

## Self-Check

- [ ] `final.mp4` passes all QA fields
- [ ] video starts at the play moment (no dead pre-roll)
- [ ] `video_url` is a permanent, reachable URL
