# Phase 03: Reference Image Generation (`reference_list` Enrichment)

## Goal

Generate base reference images for every `character`, `location`, and `object` entry in `reference_list`, then patch each entry with `image_url`, `image_prompt`, `image_model`, `image_state`, and optional `image_failure_reason`. This phase verifies but does not promote the slot.

## Required Inputs and Loads

Read current `reference_list`, promoted `visual_config`, `schemas/reference_list.schema.json`, `templates/reference_list.minimum.json`, `docs/core_principles.md`, and `docs/content_safety.md`. Load `image-generation` before generating.

## Workflow

1. Read the full current `reference_list` and preserve all existing fields.
2. For each base entry, write an image prompt from its `description` plus `Visual style: <visual_config.visual_style>`.
3. Preserve complete visual style on locations because they carry much of the film look.
4. Generate one image per base entry. Inspect each generated character image as soon as it lands and judge it against the entry description, the visual style, and your persona; regenerate immediately if it is off-target. Do the same for any critical location/object.
5. Patch the entry with generation metadata.
6. If generation fails, set `image_state="failed"` and `image_failure_reason`, then retry or use fallback according to model behavior.

## Prompt Requirements

Prompts use target-language creative prose where user-visible, but keep ids and technical model terms in English. Include identity baseline for characters, environment grounding for locations, and unique design marks for objects. Avoid unsafe explicit wording; use cinematic implication.

## Self-Check

Every base entry has either successful image metadata or a deliberate failed state; character identity is stable across variants; style line is present; no prior fields were lost.

## Output

Patch/write the full `reference_list` and finalize with `verify` only. Do not promote until Phase 05.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/04-segment-plan/PHASE.md`.
