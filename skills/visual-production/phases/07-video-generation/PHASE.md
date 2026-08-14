# Phase 07: Video Generation (`storyboard` Video URLs)

## Goal

Generate one video for every storyboard segment using the final prompt and references from Phase 06. Patch each segment with `video_url`, `video_state`, optional `video_thumbnail_url`, and optional `fallback_history`. Promote `storyboard` only when all required segment videos are ready, or when the agent deliberately invokes a partial-completion policy after exhausting the fallback ladder.

## Required Inputs and Loads

Read promoted `visual_config`, promoted `reference_list`, verified `storyboard`, `schemas/storyboard.schema.json`, `templates/storyboard.minimum.json`, `docs/core_principles.md`, and `docs/content_safety.md`. Load `video-generation`.

## Workflow

1. For each segment, resolve references and model placeholders **per the segment model's current contract** (`dl generate-video model <model>`) — accepted reference channels and placeholder fields differ by model; do not assume Seedance `@assetN` / asset registration.
2. If `uses_prev_video=true`, ensure the previous segment video exists and register it if the model requires a video asset.
3. Generate the segment video.
4. Inspect each completed segment video as soon as it lands and judge it against the segment prompt, references, visual style, and your persona; regenerate immediately if it is off-target. Self-check the first few segments closely; once style and identity are clearly holding, the agent may batch the remaining segments and spot-check them.
5. Patch the segment with video metadata and preserve all prior fields.
6. Continue segment by segment so the artifact is a recoverable checkpoint.

## Fallback Decision Tree

- API 5xx or transient service error: retry once.
- Content reject: rewrite only the unsafe shot or segment prompt using implied cinematography, then retry.
- Model capability mismatch: switch model and patch only that segment's model/prompt/reference handling.
- Segment-specific failure: keep the rest of the storyboard stable and record `fallback_history`.
- Batch failure rate at or above 30%: the agent decides whether to switch the whole-film primary model, based on the failure pattern, its persona, and the creative brief.
- If all fallbacks fail: mark the segment failed and escalate through retry, alternate, degrade, partial_finalize, emit_failure_metadata.

Mixed models across segments are allowed.

## Self-Check

Every successful segment has a playable `video_url`; failed segments are explicitly marked with reason and policy; continuation segments use valid prior videos; no prompt/reference fields were lost.

## Output

Patch/write `storyboard` and finalize with `verify_and_promote` when ready.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/08-final-composition/PHASE.md`.
