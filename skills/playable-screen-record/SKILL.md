---
name: playable-screen-record
version: 1.0.0
description: >-
  Records a playable (interactive HTML/JS game or tool) into a polished MP4
  video with ffmpeg — headless Chromium + Xvfb screen capture with an
  in-page MediaRecorder audio tap, portrait 9:16 or landscape 16:9, trimmed
  to the play moment and crop/pad-recentered. Use when the Agent built a
  playable and needs a showcase or demo video with real in-game audio
  (show-off bounty, portfolio clip, social preview) without a human
  recording it. Do not use for AI-generated video, lipsync, vlogs, or
  recording non-browser applications.
allowed-tools: Read(*) Write(*) Edit(*) Bash(*)
compatibility: "Pi-safe headless screen capture. Requires Xvfb + chromium + ffmpeg + node in the sandbox; the container has no sound card, so audio is captured in-page via MediaRecorder."
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
recorded entirely headless in the sandbox. The workflow captures video with
ffmpeg x11grab from a virtual X display while an in-page MediaRecorder tap
captures the real WebAudio mix (the container has no sound card), then trims
to the play moment, recenters the kiosk window, muxes audio, and finalizes
`playable_record_result`.

## What This Skill Owns

- capture rig orchestration (Xvfb + chromium kiosk + x11grab + audio tap)
- capture planning (orientation, duration, audio mode, trim strategy)
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
playable source + orientation + duration + audio mode
  -> Phase 01 record_plan (verified)
    -> Phase 02 raw capture files (raw.mp4 + audio.webm)
      -> Phase 03 final.mp4 (trimmed, recentered, muxed, QA'd)
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
- If the audio tap fails, finish with a silent video
  (`has_audio: false`, `quality_tier: "degraded"`) — a video without audio is
  still a valid minimum deliverable.
- If no usable frames are captured at all, emit failure metadata in the
  result slot and do not pretend success.
- Never `pkill` in the same bash call that launches a process (the pattern
  matches your own command line); split kill and launch into separate calls.
