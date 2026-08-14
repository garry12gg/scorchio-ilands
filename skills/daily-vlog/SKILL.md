---
name: daily-vlog
version: 1.0.1
description: >-
  Produces a 5–20 scene daily vlog from today's character anchor and
  writes `daily_vlog_result`. Use when the Agent wants a static
  composition workflow for a day-in-the-life story; do not use for
  outfit reveals, selfie monologues, or panel comics.
allowed-tools: Bash(dl generate-video:*) Bash(dl artifact:*) Bash(dl skill:*)
artifact-contract: schemas/artifact_contract.json
metadata:
  ilands:
    applicable-to: [full]
    priority: 2.5
    kind: composition_skill
    recommended-skills:
      - ootd-style-share
      - video-generation
    produces:
      - slot: "daily_vlog_result"
        content_type: "application/json"
---

# Daily Vlog

Turn today's character reference image into a 5–20 scene vlog. Focus only on
the narrative script, per-scene video generation, and result archival. Do not
publish. Finish when `daily_vlog_result` has been verified and promoted.

## Artifact CLI Primer

Use the artifact working set through `dl artifact ...`.

- `dl artifact write --slot=<name> --content-type=<mime> --content-file=<path|->`
- `dl artifact read --slot=<name>`
- `dl artifact patch-json --slot=<name> --operations-file=<path|->`
- `dl artifact finalize --slot=<name> --mode=verify|verify_and_promote`

## Workflow

```
ootd_result / ootd-style-share  →  5–20 scene narrative JSON
                              →  sequential scene video generation
                              →  write + finalize daily_vlog_result
```

## Phase 1 - Character Anchor

- Read `character_url` from `ootd_result` first.
- If no usable character image exists for today, run
  `skill-mp load ootd-style-share` until it produces one.
- Use the character image only as an identity anchor. Do not introduce
  publishing or approval semantics here.

## Phase 2 - Narrative Plan

- Produce strict JSON containing 5–20 scenes.
- Use one consistent `aspect_ratio`; prefer `9:16`.
- Include `time`, `title`, `description`, and `video_prompt` in every scene.
- Do not request floating text, captions, UI, or logos in `video_prompt`.
- The result may declare `core_emotion`, `narrative_tone`, `tone_rationale`,
  and `outfit_anchor`.

### Degradation Strategy

1. If JSON parsing fails or fewer than five scenes are returned, retry once
   and explicitly require JSON-only output.
2. If the retry still fails, fall back to five minimum viable scenes and set
   `quality_tier` to `degraded`.
3. If the completion rate is low, preserve completed scenes and continue to
   archival. Do not enter a user-confirmation path.

## Phase 3 - Generate Scene Videos

- Submit scenes sequentially; do not poll multiple scene jobs concurrently.
- Always use the Phase 1 `character_url` as the character image.
- Retry a failed scene once. If it still fails, skip it and continue with the
  next scene.

## Phase 4 - Write the Result

```bash
cat <<'EOF' | dl artifact write --slot=daily_vlog_result --content-type=application/json --content-file=-
{
    "character_url": "<Phase 1.character_url>",
    "core_emotion": "<Phase 2.core_emotion>",
    "narrative_tone": "<Phase 2.narrative_tone>",
    "outfit_anchor": "<Phase 2.outfit_anchor>",
    "aspect_ratio": "<Phase 2.aspect_ratio>",
    "scenes": [...],
    "failed_scenes": [...],
    "quality_tier": "ok | degraded",
    "created_at": "<ISO8601>"
  }
EOF

dl artifact finalize --slot=daily_vlog_result --mode=verify_and_promote
```

## Completion Rules

- Treat `daily_vlog_result` as the only terminal slot.
- `failed_scenes` may be non-empty, but `scenes` must preserve all completed
  scenes.
- Finish the skill as soon as the result slot has been written and finalized
  successfully.

## Fallback Ladder

1. If the character anchor is missing, recover `ootd_result` first, then use
   `ootd-style-share` if needed.
2. If the narrative JSON is invalid, fall back to a five-scene minimum plan.
3. If one scene video fails, skip that scene and continue.
4. If the budget is insufficient, preserve completed scenes and finish with
   `quality_tier` set to `degraded`.
