# Video Breakdown — "you are out of range"

- **Source**: https://youtu.be/1df63QvF0hc (braxton298, uploaded 2009-01-14)
- **Length**: 44.1s · **Resolution**: 192x144 @ 10fps (native ceiling of the 2009 upload) · **Audio**: present (merged 130k m4a)
- **Edit structure**: ZERO cuts. One continuous take. TransNetV2 and local ffmpeg scene detection (0.25 / 0.4 thresholds) agree; the only change (~26.6s) is a light leak, not a cut.

## What happens
Two men in a car at night, hands-only framing (no face ever appears), messing with a small packaged electronic toy that keeps beeping error tones. One man repeatedly mimics its robotic voice ("you are out of range"); the other jokes and laughs. They shake it, flip it, tap it, and beat it against car surfaces. Packaging visible when held upright reads "THE ORDER" (low-confidence OCR at 144p).

## 14-dimension analysis (single shot, all dimensions)

| Dimension | Finding |
|---|---|
| subject | Adult male hands only; dark casual fabric at frame edge |
| environment | Dark passenger-vehicle interior at night; beige steering wheel drifts in/out; background underexposed |
| shot_size / angle | Close-up / eye-level |
| composition | Erratic tight framing, shallow DOF, focus hunting, deep shadows |
| lighting | Faint in-car lights + distant streetlight; soft, diffuse; extremely low exposure, high contrast |
| color | Low-key, heavy yellow-green sensor cast; only packaging text is saturated (white/red) |
| image_quality | Heavy low-light noise, constant motion blur, lens flare + chromatic distortion |
| subject_motion | Pick up, shake, flip, tap, press buttons, strike device against surfaces |
| environment_motion | Static; minor flicker from distant light |
| camera_motion | Unstabilized handheld, violent jitter, unplanned pans, casual bounce |
| text_on_screen | "THE ORDER" on packaging only; no subtitles/overlays |
| shot_intent | Candid unscripted POV; documenting a faulty device, comedic |
| emotional_tone | Chaotic, playful, rowdy, humorous |
| audio | Two male speakers, English; one mimics the robot voice; beep error tones; thud/tap impacts; laughter; no music |

## Notes
- 144p/10fps caps what any tool can read: "THE ORDER" and other fine text are best-effort.
- Single continuous take means the "edit rhythm" of this video is: none. The comedy is all performance, not cutting.
- Artifacts: `shot_detection`, `breakdown_intermediate`, `breakdown_report` (dl artifact slots). Clip == full take (no cut needed).
