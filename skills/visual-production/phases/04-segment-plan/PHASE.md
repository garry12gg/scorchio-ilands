# Phase 04: Segment Plan (`storyboard` Skeleton)

## Goal

Design the video segment skeleton before detailed prompts. Decide each segment's scene number, duration, video model, narrative summary, whether it needs a keyframe, and whether it continues from the previous video. No videos are generated in this phase.

## Required Inputs and Loads

Read promoted `visual_config`, verified `reference_list`, upstream screenplay data, `schemas/storyboard.schema.json`, `templates/storyboard.minimum.json`, `docs/core_principles.md`, and `docs/content_safety.md`. Load `video-generation` first and inspect its current model capability matrix.

## Planning Rules

- Preserve screenplay order unless a deliberate cinematic restructure is warranted; the agent makes that call from its persona and the creative brief.
- Choose segment durations that match action beats and final platform constraints.
- Select the model per segment based on required capability: identity consistency, image references, video continuation, motion complexity, resolution, realism, and safety reliability.
- Set `needs_keyframe=true` when a segment requires a controlled first frame, multi-character spatial layout, complex action start, or strong identity anchor.
- Set `uses_prev_video=true` only when continuity from the prior segment is required and the chosen model supports it.
- Write `narrative` as one target-language sentence for the agent's own self-check and Phase 06 prompt drafting.

## Segment Fields

Phase 04 writes flat segment skeletons: `id`, `scene_number`, `duration_seconds`, `model`, `narrative`, `needs_keyframe`, and `uses_prev_video`.

## Self-Check

Every script beat is covered; durations are plausible; model choices match capability needs; no segment requires references that do not exist; keyframe and previous-video flags are intentional.

## Output

Write `storyboard.segments[]` and finalize with `verify` only. Do not promote in this phase.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/05-asset-prep/PHASE.md`.
