# Phase 08: Final Composition (`final`)

## Goal

Assemble promoted segment videos into the finished film, optionally add BGM, sound effects, subtitles, intro, and outro, then write and promote the `final` artifact with the final video URL and metadata.

## Required Inputs and Loads

Read promoted `visual_config`, promoted `reference_list`, promoted `storyboard`, `schemas/final.schema.json`, `templates/final.minimum.json`, `docs/skill_reference_table.md`, and `docs/core_principles.md`.

## Workflow

1. Concatenate `storyboard.segments[].video_url` in order using `ffmpeg` to create the base video.
2. Optional BGM: load `music-generation`, generate or select instrumental music, and mix with `ffmpeg` using fit/loop/trim/custom duration strategy.
3. Optional audio cues: load `add-audio-cues`. If BGM is already enabled, skip BGM and AMB cue classes and allow only SFX and stinger transients. If BGM is not enabled, all cue classes may be considered, but BGM and AMB should not both occupy the same continuous background role.
4. Optional subtitles: load `create-subtitles`, run ASR if needed, and default to burned-in subtitles.
5. Optional intro/outro: use `remotion`.
6. Write final metadata and upstream back-links.

## Final Fields

Required: `video_url` and `duration_seconds`. Include `thumbnail_url` when available, plus `aspect_ratio`, `resolution`, `segment_count`, `visual_style_summary`, and upstream slot links. Optional post-production fields may use clear prefixes such as `bgm_*`, `audio_cues_*`, `subtitle_*`, `intro_url`, `outro_url`, and `intro_outro_renderer`.

## Self-Check

Final video is playable; duration matches segment sum plus intro/outro; audio/subtitle metadata links to the owning cross-skill artifacts when used; final specs match `visual_config`; storyboard/reference/visual_config back-links are present.

## Output

Write `final` and finalize with `verify_and_promote`.

## Target Language

Use the target-language rule from `SKILL.md` for all user-facing prose and creative prompt text. Keep ids, field names, model names, commands, and aliases in English.

## Self-Check Gate

After writing and finalizing the artifact for this phase, self-check the landed artifact against the criteria above, your persona, and the creative brief. If it falls short, revise specific ids/segments (or roll back) and finalize again. Only complete once the self-check passes; never wait for a human.

## Completion

Once the self-check passes, the visual-production workflow is complete. Lipsync and publishing belong to other skills or external orchestration.
