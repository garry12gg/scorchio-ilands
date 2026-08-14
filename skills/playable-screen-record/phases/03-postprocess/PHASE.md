# Phase 03: Post-Process

## Goal

Turn raw capture into the final MP4: trim to the play moment, recenter the
kiosk window, mux the recorded audio, encode, QA with ffprobe, and get a
persistent `video_url`.

## Required Inputs

- `raw.mp4`, `audio.webm` (if audio_mode=tap)
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

### 3. Audio (audio_mode=tap)

```bash
ffmpeg -y -ss <trim> -i audio.webm -c:a aac -b:a 192k audio.m4a
```

Lazy-AudioContext pages start sounding exactly at play, so the same trim
keeps sync; if the video's in-game visuals clearly run ahead of the sound,
use `silencedetect` on `audio.webm` to find the first real onset and trim to
that instead.

### 4. Mux + encode final

```bash
ffmpeg -y -i trimmed.mp4 -i audio.m4a -c:v copy -c:a aac -shortest \
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
