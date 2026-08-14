# Phase 06: Storyboard Detail (`storyboard` Prompts and References)

## Goal

Turn each storyboard skeleton segment into a final video-generation instruction. Patch every segment with a complete `prompt` and a resolvable `references[]` array. This phase verifies but does not promote the storyboard.

## Required Inputs and Loads

Read promoted `visual_config`, promoted `reference_list`, verified `storyboard`, upstream screenplay data, `schemas/storyboard.schema.json`, `templates/storyboard.minimum.json`, `docs/core_principles.md`, and `docs/content_safety.md`.

## Prompt Rules

- `prompt` is the final video-generation prompt, not a draft.
- Include shot timing, camera size/movement, subject action, blocking, transition, reference usage, model-specific constraints, and `Visual style: <visual_config.visual_style>`.
- Represent shot structure inside the prompt string. Do not create a `shots[]` array.
- Use `[[id]]` placeholders for every referenced asset and make sure each is resolved in `references[]`.
- Match shot durations inside the prompt to `duration_seconds`.
- Use target-language creative prose for audience-facing narrative and prompt text unless a model requires English prompt text; even then, keep artifact summaries in target language.
- Avoid explicit unsafe wording and preserve meaning through cinematic implication.

## Reference Rules

Each `references[]` item needs `alias` and `as`. It must locate the resource by either `ref_id` lookup or one inline field: `image_url`, `asset_id`, or `video_url`. For video continuation, `ref_id` may point to a previous `storyboard.segments[].id`.

Reference channels and placeholder syntax are **per-model, not Seedance-only**: consult `video-generation` for this segment's `model` (`dl generate-video model <model>`) and choose aliases (`image1` = plain image / `asset1` = registered asset / `video1` = continuation) that match the channels that model actually accepts. Do not assume `@assetN` / asset registration for a model that takes plain image references; only use `asset1` when that model requires a registered `asset_id`.

## Self-Check

Every segment has a complete prompt; all `[[id]]` placeholders resolve; reference aliases match model placeholder needs; duration math is coherent; safety rewrites preserve dramatic meaning; prior skeleton fields remain intact.

## Output

Patch/write `storyboard` and finalize with `verify` only. Do not promote until Phase 07 videos are attached.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/07-video-generation/PHASE.md`.
