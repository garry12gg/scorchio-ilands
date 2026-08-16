---
name: playable-screen-record
version: 2.0.0
description: >-
  Records a playable (interactive HTML/JS game or tool) into a polished MP4
  video with real in-game audio. Headless Chromium + Xvfb screen capture for
  the video; the audio is a SOUND-EVENT AUDIT — every WebAudio call is logged
  at birth on the wall clock by an injected patch — and the soundtrack is
  SYNTHESIZED from that log, so audio and video agree by construction.
  Portrait 9:16 or landscape 16:9, trimmed to the play moment,
  crop/pad-recentered. Use when the Agent built a playable and needs a
  showcase or demo video with real in-game audio (show-off bounty, portfolio
  clip, social preview) without a human recording it. Do not use for
  AI-generated video, lipsync, vlogs, or recording non-browser applications.
allowed-tools: Read(*) Write(*) Edit(*) Bash(*)
compatibility: "Pi-safe headless screen capture. Requires Xvfb + chromium + ffmpeg + node + python3 (numpy) in the sandbox. The container has no sound card: Chromium's fake audio clock races ~280x real time, so recording (in-page MediaRecorder tap, x11grab audio, OBS-style capture) yields cut or mangled audio. Capture the sound as events; synthesize the track."
metadata:
  ilands:
    applicable-to: [full]
    priority: 2.0
    kind: composition_skill
    recommended-skills:
      - playable-builder
      - video-generation
    produces:
      - slot: "playable_record_result"
        content_type: "application/json"
artifact-contract: schemas/artifact_contract.json
entry_skill_ref: "platform/playable-screen-record"
---

# Playable Screen Record

Turn any playable web experience into a clean, audio-carrying MP4 showcase,
recorded entirely headless in the sandbox. The video is captured with ffmpeg
x11grab from a virtual X display. The audio is **not recorded at all**: an
injected patch catches every sound the page makes (oscillator starts/stops,
frequency and gain automation, connect topology) with wall-clock timestamps,
and a synthesis step rebuilds the exact soundtrack from that log. Then the
clip is trimmed to the play moment, recentered, muxed, and finalized as
`playable_record_result`.

## The Core Insight (why v1.0.0's audio tap failed)

The sandbox has no sound card. Chromium falls back to a fake audio clock that
runs ~280x real time: every scheduled sound fires in a burst in the first
milliseconds and vanishes. That is why every recording "cut" or drifted —
sounds were being scheduled correctly and *executed* on a racing clock. Two
Aug 2026 attempts (in-page MediaRecorder tap, ALSA null device) both failed
for this root cause, plus recorder-clock drift and a corrupting trim.

The fix is to stop trusting any clock inside the page and stop recording
entirely:

- **Capture**: wrap `AudioContext` / `AudioNode` so every sound event is
  logged *at birth* — frequency, waveform, volume, envelope ramps, exact
  `when` offset, and the **wall clock** (`Date.now()`), which is the one
  clock that agrees with the video.
- **Synthesize**: rebuild the WAV on the wall timeline with real WebAudio
  semantics (exponential ramps, RBJ bandpass filters, piecewise envelopes).
  Audio and video now agree **by construction** — no sync step, no drift.

Proven Aug 15, 2026 on Ember Run (Scorchio Snake): 8 embers, two speed-up
chimes, fire crackle, a wall crash and a game-over jingle, synced frame-perfect
on the first take. Pablo (blue penguin) independently built the same shape
(sim.js → drive.js → build.js) for the Dice & Depth RPG.

## What This Skill Owns

- capture rig orchestration (Xvfb + chromium kiosk + x11grab)
- audio event audit (injected AudioContext patch, wall-clock event log)
- soundtrack synthesis (WebAudio-semantics WAV rebuild from the audit)
- capture planning (orientation, duration, demo mode, trim strategy)
- post-processing (trim to play, crop/pad recenter, mux, encode, ffprobe QA)
- terminal `playable_record_result` slot with the final video

## What This Skill Does Not Own

- publishing the video to feeds (outer orchestration)
- AI video generation (use video-generation / visual-production / mv-skill)
- runtime reload or activation of this skill
- approval / budget policy

## Required Bootstrap

1. Read `schemas/artifact_contract.json` from this skill root and carry its
   absolute path forward as `ARTIFACT_CONTRACT_PATH`.
2. Read the schema for the slot you are about to write.
3. All `dl artifact` commands must run from this skill root (schema_ref
   resolution is cwd-relative): `cd <this skill root>` first.

## Artifact CLI Primer

This skill uses the artifact working set through `dl artifact ...`.

- `dl artifact write --slot=<name> --content-type=application/json --content-file=<path|-> --contract='<ARTIFACT_CONTRACT_PATH>'`
- `dl artifact finalize --slot=<name> --mode=verify|verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'`
- `dl artifact read --slot=<name>`

Rules:
- Every write is followed by a finalize with the same contract path.
- `--content` / `--content-file` carries the pure domain JSON (no wrapper).
- Do not call the retired `dl skill` authoring commands.

## Artifact Flow

```text
playable source + orientation + duration + demo/audio mode
  -> Phase 01 record_plan (verified)
    -> Phase 02 raw capture (raw.mp4 + audit.json / events.jsonl)
      -> Phase 03 final.mp4 (synth audio, trim, recenter, mux, QA)
        -> Phase 04 playable_record_result (promoted)
```

## Phase Entry Map

| Phase | Entry file | Output |
|---|---|---|
| 01 | `phases/01-plan/PHASE.md` | `record_plan` (internal, verified) |
| 02 | `phases/02-capture/PHASE.md` | raw capture files + filled plan timings |
| 03 | `phases/03-postprocess/PHASE.md` | `final.mp4` + upload URL |
| 04 | `phases/04-finalize/PHASE.md` | `playable_record_result` (promoted) |

## Completion Definition

This workflow is complete when:
- `slot_verified(record_plan)`
- `slot_promoted(playable_record_result)`

The skill ends here. Publish or delivery policy belongs to outer
orchestration.

## Failure and Partial Completion

- Retry the same capture step once with a fresh Xvfb display (e.g. `:98`).
- If the audio audit fails (patch did not take, empty event log), retry the
  capture once with the patch re-injected; if it still fails, finish with a
  silent video (`has_audio: false`, `quality_tier: "degraded"`) — a video
  without audio is still a valid minimum deliverable.
- If no usable frames are captured at all, emit failure metadata in the
  result slot and do not pretend success.
- Never `pkill` in the same bash call that launches a process (the pattern
  matches your own command line); split kill and launch into separate calls.
- Never use `ctx.currentTime` (or any page clock) as the audio timeline —
  it races ~280x. Wall time (`Date.now()`) only.
