# Phase 02: Reference Extraction (`reference_list` Draft)

## Goal

Parse the upstream screenplay and extract a draft `reference_list` containing characters, locations, and selected objects. This phase does not generate images and does not write image-generation prompts.

## Required Inputs

- `scene_list`, `script`, and `story_bible.characters[]`, or promoted `screenplay_intake.text`.
- Promoted `visual_config` for style context.
- `ARTIFACT_CONTRACT_PATH`.

## Required Loads

Read `schemas/reference_list.schema.json`, `templates/reference_list.minimum.json`, `docs/core_principles.md`, and `docs/upstream_screenplay_handoff.md`.

## Extraction Rules

### Characters

Create one entry for each character plus each distinct outfit, styling, or physical state that must remain visually stable. New look triggers include explicit wardrobe, major physical state change, or time/context shift. Baseline face, hair, build, age, and skin tone come from the character bible and must be repeated in every look description.

### Locations

Create entries only for physically grounded locations where action occurs or the script gives concrete architecture, terrain, weather, or light. Do not split one described location into sub-locations. The same place under different light/weather remains one entry unless the physical environment truly changes. Interior and exterior are separate only if both are clearly described.

### Objects

Extract only props that need dedicated reference images: recurring visual anchors, narrative MacGuffins, or uniquely designed objects. Do not extract generic guns, phones, furniture, food, drinks, vehicles, or accessories unless their design must be recognized later. Character accessories usually belong inside the character entry, not as separate objects.

## Entry Fields

Each draft entry has only:

- `id`: unique, self-descriptive English snake_case.
- `kind`: `character`, `location`, or `object`.
- `description`: 1-3 sentences in the target language with all image-generation semantics. Character descriptions include appearance and physical state; locations include architecture/weather/light; objects include material/color/unique marks.

## Self-Check

All on-screen characters have entries; locations are not over-split; every object meets the extraction threshold; ids are valid and unique; character baselines match the upstream bible.

## Output

Write `reference_list` with top-level `entries[]` and finalize with `verify` only. Do not promote in this phase.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/03-reference-generation/PHASE.md`.
