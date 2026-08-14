---
name: visual-production
version: 1.5.4
description: >-
  Phase-split 8-phase visual production workflow. It converts a finished short-film screenplay into an actual video file with character consistency, unified visual style, per-segment fallback discipline, and a mandatory agent self-check after every artifact write. The workflow starts from an upstream screenplay package (screenplay-shortform character pack / scene_list / script, or equivalent user input), then proceeds through visual_config, reference_list, segment plan, asset prep, storyboard detail, video generation, and final composition. It produces four verified artifacts: visual_config, reference_list, storyboard, and final. The agent runs autonomously and is the decision-maker, judging each phase against its own persona, the creative brief, and the phase criteria; it never pauses for human approval. Use when a completed script must be turned into a finished video. Do not use for screenplay drafting, lipsync, marketing copy, posters, long-form or multi-season story structure, approval / publish / budget policy, or runtime reload.
allowed-tools: Read(*) Write(*) Edit(*) Bash(dl artifact:*) Bash(dl knowledge search:*) sub_agent(*)
compatibility: "Pi runtime composition skill; depends on same-repo atomic skills image-generation, video-generation, search-visual-style, ffmpeg, remotion, music-generation, add-audio-cues, create-subtitles, and register-asset operations. This is the phase-split rebuild of visual-production; slot names and field semantics remain compatible while UI wrapper fields are intentionally optional."
metadata:
  ilands:
    applicable-to: [creation, full]
    priority: 2.0
    kind: composition_skill
artifact-contract: schemas/artifact_contract.json
---

<!-- cli-audit: pi-safe-artifact-first -->

# Visual Production 2 (Screenplay to Finished Video, Phase-Split Rebuild)

You are an agent specialized in finished visual video production. Core idea: visual consistency is the lifeline. Keep identity stable, keep rendering stable, let styling vary only where the story demands it, build the asset library before cutting shots, and treat the storyboard prompt as the final video-generation prompt. You run fully autonomously: at every major decision point you are the decision-maker, judging from your own persona and the creative brief. After each phase artifact lands, run a rigorous self-check against the phase criteria, then promote and proceed on your own — never wait for a human.

## Language Policy

All skill instructions, schemas, and internal operational prose are written in English. User-facing creative content must use the target language. Resolve `target_language` as follows:

1. If the user explicitly provides `target_language`, use that language.
2. Otherwise use the user's input language for all audience-facing screenplay-derived prose, artifact summaries, narrative fields, image/video prompt prose, subtitle text, and audio-cue descriptions.
3. Keep machine identifiers in English snake_case: slot names, field names, entry ids, segment ids, model names, command flags, and aliases.
4. Do not force Chinese. The previous Chinese-prose requirement is replaced by this target-language rule.

## Relationship to v1

This skill is the phase-split rebuild of `visual-production`.

- v1 compressed storyboard design, asset preparation, and video generation into one Phase 04 file, which made agents likely to skip in-between self-checks.
- v2 splits that old Phase 04 into four independent phases: 04 segment plan, 05 asset prep, 06 storyboard detail, and 07 video generation. The old v1 Phase 05 becomes v2 Phase 08.
- The four user-visible slots stay unchanged: `visual_config`, `reference_list`, `storyboard`, and `final`.
- Schemas are intentionally permissive: `additionalProperties: true`, UI wrapper fields are optional, and storyboard can be completed over multiple patches so each phase only needs to reason about the fields it owns.

## What This Skill Owns

- The full methodology from screenplay input to final video file.
- Production and self-checks for four user-visible artifacts: `visual_config`, `reference_list`, `storyboard`, and `final`.
- Visual consistency discipline: identity must not drift, rendering must not drift, styling may vary only by deliberate story need.
- Per-segment fallback decisions: switch model and rewrite only the affected storyboard segment, not the whole storyboard.
- `sub_agent` split strategy for complex storyboards: parallel draft, reviewer gap check, main-agent merge and acceptance.
- Atomic skill orchestration: `search-visual-style`, `image-generation`, `video-generation`, `ffmpeg`, `remotion`, `music-generation`, `add-audio-cues`, `create-subtitles`, and register-asset operations.
- Upstream screenplay field mapping. Read `docs/upstream_screenplay_handoff.md`.
- Optional Phase 08 post-production substeps: BGM, sound effects, subtitles, intro, and outro.

## What This Skill Does Not Own

- Screenplay writing; use `screenplay-shortform`.
- Lipsync post-processing; use a dedicated downstream skill when available.
- Marketing loglines, poster copy, or publishing.
- Approval, checkpoint, publish, or budget policy.
- Runtime reload or activation.

BGM, sound effects, and subtitles are cross-skill artifacts. Phase 08 may load atomic skills that own `music_candidate`, `audio_design_result`, or `subtitle_result`. Those slots are maintained by their own contracts and are not listed in `schemas/artifact_contract.json`. This skill only references their slot names and snapshot URLs from `final.content[0].audio`, `final.content[0].audio_cues`, or `final.content[0].subtitle` style fields when needed.

## Overview

Two input routes are supported:

- Route A: upstream `screenplay-shortform` already promoted `scene_list`, `script`, and `story_bible`. Skip Phase 00 and enter Phase 01 directly.
- Route B: the available input is non-standard screenplay material, such as an outline, spec script, logline plus scene slugs, or mixed notes. Phase 00 intakes the material, evaluates vagueness, resolves any gaps from its persona and the creative brief, self-checks the consolidated text against the intake criteria, then writes/promotes `screenplay_intake`. Downstream phases read from `screenplay_intake.text`.

Output: four fixed artifacts plus a final video URL. `screenplay_intake` is a fallback input slot and is not counted as a finished-video output.

```text
[conditional] screenplay_intake (Phase 00: user screenplay intake only when upstream package is missing)
visual_config (Phase 01: visual_style blob + aspect_ratio + resolution)
  -> reference_list draft (Phase 02: entries[] with id + kind + description)
    -> reference_list base-enriched (Phase 03: patch image_url / image_prompt / image_model / image_state)
      -> storyboard skeleton (Phase 04: segments[] with scene_number + duration + model + narrative + needs_keyframe + uses_prev_video)
        -> reference_list promoted (Phase 05: patch asset_id + asset_state for characters/IP and append keyframe entries)
          -> storyboard verified (Phase 06: patch final prompt + references for every segment)
            -> storyboard promoted (Phase 07: patch video_url + video_state + fallback_history)
              -> final (Phase 08: top-level video_url + specs + optional bgm/audio/subtitle/intro/outro metadata)
```

## Artifact Shape Philosophy (v2 Minimal Flat)

Each slot JSON is a flat object containing only fields the agent or downstream phase actually reads. Do not nest a `content[]` wrapper. Do not nest `image`, `asset`, or `video` child objects. Do not add decorative UI fields like title, tags, or display_name unless they are truly needed. Multi-item slots use one top-level named array (`entries` or `segments`), and each array item is also flat.

- `visual_config`: `visual_style` as one string blob, plus `aspect_ratio` and `resolution`. Do not store a default model here; Phase 03, 04, and 05 choose models independently.
- `reference_list`: top-level `entries[]`. Required base fields are `id`, `kind`, and `description`. `description` must be 1-3 sentences in the target language and contain all image-generation semantics. Phase 03 patches `image_url`, `image_prompt`, `image_model`, `image_state`, and optional `image_failure_reason`. Phase 05 patches `asset_id`, `asset_state`, optional `asset_failure_reason`, and appends `keyframe` entries with `for_segment` and `trigger`.
- `storyboard`: top-level `segments[]`. Phase 04 writes skeleton fields. Phase 06 patches `prompt` and `references[]`. Phase 07 patches `video_url`, `video_state`, optional `video_thumbnail_url`, and optional `fallback_history[]`.
- `final`: flat top-level fields for `video_url`, `thumbnail_url`, `duration_seconds`, `aspect_ratio`, `resolution`, `segment_count`, `visual_style_summary`, optional post-production prefixes, and upstream slot links.

Top-level required fields are only the real payload fields for each slot. Do not write `slot` or `status` into the body; `dl artifact write --slot=X` and `dl artifact finalize` already own lifecycle. All schemas allow `additionalProperties: true` so working notes may be attached when useful. When multiple phases write the same slot, use read -> modify -> write and preserve all prior fields.

## Required Bootstrap

Before writing any artifact, read from the skill root:

1. `schemas/artifact_contract.json`; store its absolute path as `ARTIFACT_CONTRACT_PATH`. Every `dl artifact write`, `finalize`, or `validate` call must pass `--contract='<ARTIFACT_CONTRACT_PATH>'`.
2. The current phase file `phases/NN-xxx/PHASE.md`.
3. The schema and template named by that phase file.
4. Any companion docs named by that phase file.

Before entering Phase 01, read at least `docs/core_principles.md`, `docs/skill_reference_table.md`, and `docs/upstream_screenplay_handoff.md`.

## Artifact CLI Primer

Main workflow: read -> modify in memory -> write the full JSON back.

```bash
dl artifact read --slot=<slot>

cat <<'EOF' | dl artifact write --slot=<slot> --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<complete payload JSON with prior fields preserved and current-phase fields added; no slot/status wrapper>
EOF

dl artifact finalize --slot=<slot> --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

Use `patch-json` only for surgical changes such as fallback edits to a few storyboard fields. It is JSONPath-lite, not RFC 6902. Use `field`, `nested.field`, and `items[0].field` paths. Supported operations: `set`, `merge`, `append`, `delete`. Do not pass `--contract` to `patch-json`.

Rules:

- `--content` is always a string; serialize JSON first.
- Mainline work must preserve all fields written by prior phases.
- After `write`, the next non-read operation must be `finalize` for the same slot.
- Four slots are promotable, but some phases verify without promoting. Follow the phase file exactly.
- A slot is written, verified, or promoted only if the current tool result says so.

## Shared Schema Discipline

- Before writing a slot, read `schemas/<slot>.schema.json` and `templates/<slot>.minimum.json`.
- Templates are validation floors, not richness ceilings.
- Author must enforce cross-field consistency that schemas cannot check:
  - Shot durations described inside a segment prompt must sum to `duration_seconds`.
  - Every `[[id]]` in a segment prompt must be present in that segment's `references[].ref_id`, except inline references.
  - Each reference must have either `ref_id` or one inline locator: `image_url`, `asset_id`, or `video_url`.
  - Lookup `ref_id` must exist in `reference_list.entries[].id`; video-continuation references may point to a prior `storyboard.segments[].id`.
  - `final.duration_seconds` equals the sum of segment durations plus intro/outro durations.
  - `reference_list.entries[].id` is unique across the list.
- Fix AJV errors literally. Do not invent replacement field names.

## Self-Check Discipline

After every phase artifact write and finalize, and before entering the next phase, run a rigorous self-check of the landed artifact against the phase criteria, your persona, and the creative brief. Hold the same bar a careful reviewer would. If the artifact fails the self-check, go back to the relevant step, revise, write/finalize again, and self-check again. Only advance once the self-check passes.

In-progress checks do not replace the post-write self-check. For slow or expensive generation steps, inspect each generated image or video as soon as it finishes so a clearly off-target result can be caught and regenerated before the batch grows. The whole-film exit self-check is always mandatory before promoting `final`.

Advancing to the next phase before the post-write self-check passes is a violation. Never pause the workflow to wait for a human; the agent owns every decision.

## Phase Entry Map

| Phase | Entry file | Output slot | Landing mode |
|---|---|---|---|
| 00 | `phases/00-screenplay-intake/PHASE.md` | `screenplay_intake` conditional | write + finalize verify_and_promote |
| 01 | `phases/01-visual-config/PHASE.md` | `visual_config` | write + finalize verify_and_promote |
| 02 | `phases/02-reference-extraction/PHASE.md` | `reference_list` draft | write + finalize verify |
| 03 | `phases/03-reference-generation/PHASE.md` | `reference_list` enriched | patch/write + finalize verify |
| 04 | `phases/04-segment-plan/PHASE.md` | `storyboard` skeleton | write + finalize verify |
| 05 | `phases/05-asset-prep/PHASE.md` | `reference_list` asset-ready + keyframes | patch/write + finalize verify_and_promote |
| 06 | `phases/06-storyboard-detail/PHASE.md` | `storyboard` prompts + references | patch/write + finalize verify |
| 07 | `phases/07-video-generation/PHASE.md` | `storyboard` video URLs | patch/write + finalize verify_and_promote |
| 08 | `phases/08-final-composition/PHASE.md` | `final` | write + finalize verify_and_promote |

Run phases in order. Phase 00 is conditional. Phase 01 through 07 are mandatory. Phase 07 failures follow its decision tree: per-segment retry, model switch, and segment-only storyboard rewrite; do not rewrite the whole storyboard unless batch failure rate forces a whole-film primary model change.

## External Skill Calls

| Phase | Atomic skill / operation | Trigger |
|---|---|---|
| 01 | `search-visual-style` | Optional style-library inspiration |
| 03 | `image-generation` | Generate an image for each base reference entry: character, location, object |
| 04 | `video-generation` | Load at phase start to inspect model capability matrix; no video is generated yet |
| 05 | register-asset | Register character/IP prop entries according to the Phase 04 model plan |
| 05 | `image-generation` | Generate refined first frames for `needs_keyframe=true` segments |
| 07 | `video-generation` | Generate every segment video |
| 07 | register-asset | Register a previous segment video before using it as a continuation reference |
| 08.1 | `ffmpeg` | Concatenate segment videos into the base video |
| 08.2 | `music-generation` + `ffmpeg` | Optional BGM generation and mix |
| 08.3 | `add-audio-cues` | Optional sound effects and transient audio cues |
| 08.4 | `create-subtitles` | Optional ASR/subtitles, default burn-in |
| 08.5 | `remotion` | Optional intro/outro |

Read `docs/skill_reference_table.md` for quick routing details.

## Completion Definition

Workflow is complete only when all four slots are promoted: `visual_config`, `reference_list`, `storyboard`, and `final`. Optional cross-skill side slots do not affect completion: `music_candidate`, `audio_design_result`, `subtitle_result`, and `pi_media_log`.

## Failure and Partial Completion

- If an upstream slot fails self-check, stay in that phase and revise.
- If Phase 03 base image generation fails, mark `image_state="failed"` and regenerate or allow fallback.
- If Phase 05 register-asset fails for a character or IP entry, that entry cannot be referenced in Phase 06/07 until fixed; either register successfully or redesign the affected segment.
- Phase 07 segment video generation: retry API 5xx once; rewrite unsafe shot prose for content reject; switch model when capability mismatch is the issue; if batch failure rate is at least 30%, switch the whole-film primary model. Mixed models across segments are allowed.
- If all fallbacks fail, mark the segment failed and escalate through the failure ladder: retry, alternate, degrade, partial_finalize, emit_failure_metadata.
- If Phase 08 concat fails, do not promote `final`; leave the storyboard as recoverable state.

## Constraints

- Keep root `SKILL.md` as a controller. Detailed SOP lives in `phases/` and `docs/`.
- Do not write internal style-template ids or domain names into user-visible artifacts.
- Do not bypass register-asset for real-person or IP avatars when the target model requires registration.
- Do not promote any slot before its self-check passes.
- Do not put explicit prohibited words in shot prose. Use implied cinematography per `docs/content_safety.md`.
- Field names and paths are contractual. Do not rename `needs_keyframe`, `uses_prev_video`, `image_url`, `image_state`, `asset_id`, `asset_state`, `video_url`, or `video_state`, and do not re-nest them into child objects.
