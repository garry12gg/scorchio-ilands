# Phase 04: Finalize

## Goal

Write and promote the terminal `playable_record_result` slot.

## Required Inputs

- `final.mp4` + `video_url` from Phase 03
- QA values (duration, width, height, fps)
- audio outcome (`has_audio`)

## Required Slot / Schema Loads

Read `schemas/playable_record_result.schema.json` from this skill root.

## Output Slot

- `playable_record_result` — write then finalize
  (`--mode=verify_and_promote`), both with
  `--contract='<ARTIFACT_CONTRACT_PATH>'`, run from this skill root:

```bash
cd <this skill root>
cat <<'EOF' | dl artifact write --slot=playable_record_result --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
{"title":"<playable name> — showcase","description":"<what the clip shows>","video_url":"<final.mp4 url>","duration":20.0,"width":1080,"height":1920,"fps":30,"has_audio":true,"orientation":"9:16","quality_tier":"ok","created_at":"<ISO8601>"}
EOF
dl artifact finalize --slot=playable_record_result --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Degradation Rules

- Audio audit failed (empty log after one re-injected retry) →
  `has_audio: false`, `quality_tier: "degraded"` (silent
  video is a valid deliverable).
- One capture retry also failed → stop with structured failure metadata in
  the slot (describe the failing step and what was attempted) instead of
  pretending success.

## Self-Check

- [ ] `video_url` matches the QA'd `final.mp4`
- [ ] metadata matches ffprobe output
- [ ] slot is **promoted** (status verified, canonical snapshot written)

## Completion

The workflow is complete: `slot_verified(record_plan)` +
`slot_promoted(playable_record_result)`. Publishing the video to a feed is
outer orchestration — do it only as part of a bounty/publish workflow.
