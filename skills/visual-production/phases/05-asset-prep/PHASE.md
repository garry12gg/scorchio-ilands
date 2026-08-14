# Phase 05: Asset Preparation (`reference_list` Asset-Ready)

## Goal

Prepare all reference assets required by the Phase 04 model plan. Register character/IP entries when needed, generate keyframe entries for segments marked `needs_keyframe=true`, and promote `reference_list` when all required assets are ready.

## Required Inputs and Loads

Read current `reference_list`, verified `storyboard`, promoted `visual_config`, `schemas/reference_list.schema.json`, `templates/reference_list.minimum.json`, `docs/core_principles.md`, and `docs/content_safety.md`. Load `image-generation` for keyframes. Use register-asset operations as required by selected video models.

## Workflow

1. For each storyboard segment, inspect its selected model and reference needs.
2. Register character and IP prop images when the chosen model requires asset ids, especially Seedance 2.0 real-person/IP use cases.
3. Patch relevant entries with `asset_id`, `asset_state`, and optional `asset_failure_reason`.
4. For every `needs_keyframe=true` segment, generate a refined first-frame image from the required character/location/object references plus visual style. Append a `kind="keyframe"` entry with `for_segment`, `trigger`, image metadata, and any asset metadata needed downstream.
5. Inspect each generated keyframe as soon as it lands and judge it against the segment it serves, the required references, and the visual style; regenerate immediately if it is off-target.

## Keyframe Rules

A keyframe is a first-frame control image, not a new location or object. Its `description` explains the segment it serves and why precise first-frame control is needed. Default to the strongest available multi-reference image model; if rejected, fallback to an allowed alternative and preserve the attempt in notes or failure fields.

## Self-Check

Every downstream-required character/IP reference has a usable `asset_id` or the model does not require one; every keyframe segment has exactly the needed keyframe entry; failed registration does not proceed into storyboard references; all prior reference fields are preserved.

## Output

Patch/write `reference_list` and finalize with `verify_and_promote`.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/06-storyboard-detail/PHASE.md`.
