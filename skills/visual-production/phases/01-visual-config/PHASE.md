# Phase 01: Visual Configuration (`visual_config`)

## Goal

Establish the whole-film visual foundation: one `visual_style` blob, `aspect_ratio`, and `resolution`. This output is reused by every downstream phase. Changing it later means the whole film should be reconsidered, so think before writing. Final output is a verified and promoted `visual_config` artifact.

## Required Inputs

- Tone, genre, and mood keywords from the upstream screenplay package or `screenplay_intake`.
- User preferences for aspect ratio or resolution, if provided.
- `ARTIFACT_CONTRACT_PATH` from bootstrap.

## Required Loads

Read `schemas/visual_config.schema.json`, `templates/visual_config.minimum.json`, `docs/core_principles.md`, and `docs/upstream_screenplay_handoff.md`.

## Workflow

1. Extract 5-15 mood keywords from the script: emotion, era, genre, theme, and visual anchors.
2. Optionally call `search-visual-style` for inspiration.
3. Write `visual_style` as one coherent paragraph covering palette, lighting, texture/grain, era/mood, and style anchors. Downstream phases append it exactly as `Visual style: <visual_style>`.
4. Lock `aspect_ratio` and `resolution`. Default is `9:16` and `720p`. Seedance 2.0 maxes at 720p; if the user requires 1080p, Phase 04 should choose another primary model.
5. Self-check: all five style dimensions present, resolution acceptable, style matches the script tone.

## Output

Write a flat object with exactly the operational fields:

```json
{
  "visual_style": "Neo-noir gritty cinematic look, cool desaturated teal-and-amber palette, low-key directional side-light, mild 16mm film grain, late-90s urban melancholy, Fincher-inspired precision with intimate Wong Kar-wai warmth.",
  "aspect_ratio": "9:16",
  "resolution": "720p"
}
```

Finalize with `verify_and_promote`.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only advance once the self-check passes; never wait for a human.

## Next Phase

After the self-check passes, read `phases/02-reference-extraction/PHASE.md`.
